import { jsonSchema } from "ai";
import {
	startAuthorization,
} from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientInformationFull, OAuthTokens, AuthorizationServerMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { McpClient, UnauthorizedError } from "./client";
import { rawPost, isNetworkError } from "./http";
import { McpOAuthProvider, OAuthRedirectError } from "./oauth-provider";
import { discoverOAuthServer } from "./oauth-discovery";
import { oauthStore } from "./oauth-store";
import type { McpConfig, McpServerConfig, McpServerStatus, OAuthStatus, ToolResult } from "./types";

type McpToolDef = {
	description: string;
	inputSchema: ReturnType<typeof jsonSchema>;
	execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};

class McpManager {
	private clients = new Map<string, McpClient>();
	private configs = new Map<string, McpServerConfig>();
	private providers = new Map<string, McpOAuthProvider>();

	// ── 连接管理 ─────────────────────────────────────────────

	async applyConfig(config: McpConfig): Promise<void> {
		const incoming = new Map<string, McpServerConfig>(
			Object.entries(config.mcpServers).map(([name, entry]) => [
				name,
				{ name, ...entry },
			]),
		);

		const removals: Promise<void>[] = [];
		for (const [name, client] of this.clients) {
			if (!incoming.has(name)) {
				removals.push(client.close());
				this.clients.delete(name);
			}
		}
		await Promise.all(removals);
		for (const name of this.configs.keys()) {
			if (!incoming.has(name)) this.configs.delete(name);
		}

		const connectTasks: Promise<void>[] = [];

		for (const [name, serverConfig] of incoming) {
			const oldConfig = this.configs.get(name);
			this.configs.set(name, serverConfig);

			if (serverConfig.enabled === false) {
				const existing = this.clients.get(name);
				if (existing) {
					await existing.close();
					this.clients.delete(name);
				}
				continue;
			}

			const existing = this.clients.get(name);
			const configChanged = existing &&
				JSON.stringify(oldConfig) !== JSON.stringify(serverConfig);

			if (!existing || configChanged || !existing.connected) {
				if (existing) await existing.close();

				// 有保存的 token → 带 OAuthProvider 重连；否则裸连，401 再标记
				const provider = oauthStore.hasTokens(name)
					? this.getOrCreateProvider(name, serverConfig)
					: undefined;
				const client = new McpClient(serverConfig, provider);
				this.clients.set(name, client);
				connectTasks.push(
					client.connect().catch((e: unknown) => {
						if (e instanceof OAuthRedirectError || e instanceof UnauthorizedError) {
							console.warn(`[MCP] ${name} 需要授权`);
							return;
						}
						console.error(`[MCP] ${name} 连接失败:`, e instanceof Error ? e.message : String(e));
					}),
				);
			}
		}

		await Promise.all(connectTasks);
	}

	private getOrCreateProvider(name: string, config: McpServerConfig): McpOAuthProvider {
		let provider = this.providers.get(name);
		if (!provider) {
			provider = new McpOAuthProvider(name, config);
			this.providers.set(name, provider);
		}
		return provider;
	}

	// ── OAuth 流程 ───────────────────────────────────────────

	async startAuth(serverName: string): Promise<{ authorizationUrl: string }> {
		const config = this.configs.get(serverName);
		if (!config) throw new Error(`Server "${serverName}" not found`);

		const provider = this.getOrCreateProvider(serverName, config);
		const { authorizationServerUrl, authorizationServerMetadata } =
			await discoverOAuthServer(config.url);

		// 动态客户端注册（RFC 7591）
		let clientInfo = await provider.clientInformation();
		const meta = authorizationServerMetadata;
		if (!clientInfo && meta?.registration_endpoint) {
			const regRes = await rawPost(
				String(meta.registration_endpoint),
				JSON.stringify(provider.clientMetadata),
				"application/json",
			);
			if (!regRes.ok) throw new Error(`Dynamic registration failed: HTTP ${regRes.status}`);
			const fullInfo = await regRes.json() as OAuthClientInformationFull;
			await provider.saveClientInformation(fullInfo);
			clientInfo = fullInfo;
		}
		if (!clientInfo) throw new Error("No client information available");

		// PKCE authorization URL
		const state = await provider.state();
		const { authorizationUrl, codeVerifier } = await startAuthorization(
			authorizationServerUrl,
			{
				metadata: authorizationServerMetadata as AuthorizationServerMetadata,
				clientInformation: clientInfo,
				redirectUrl: provider.redirectUrl,
				scope: config.scopes,
				state,
			},
		);

		await provider.saveCodeVerifier(codeVerifier);
		return { authorizationUrl: authorizationUrl.toString() };
	}

	async completeAuth(state: string, code: string): Promise<string> {
		const serverName = oauthStore.resolveState(state);
		if (!serverName) throw new Error("Invalid or expired OAuth state");

		const config = this.configs.get(serverName);
		if (!config) throw new Error(`Server "${serverName}" not found`);

		const provider = this.getOrCreateProvider(serverName, config);
		const clientInfo = await provider.clientInformation();
		if (!clientInfo) throw new Error("No client information");

		const codeVerifier = await provider.codeVerifier();
		const { authorizationServerUrl, authorizationServerMetadata } =
			await discoverOAuthServer(config.url);

		// Token exchange
		const tokenUrl = authorizationServerMetadata?.token_endpoint
			? String(authorizationServerMetadata.token_endpoint)
			: new URL("/token", authorizationServerUrl).href;
		const tokenParams = new URLSearchParams({
			grant_type: "authorization_code",
			code,
			code_verifier: codeVerifier,
			redirect_uri: String(provider.redirectUrl),
			client_id: clientInfo.client_id,
		});
		if (clientInfo.client_secret) {
			tokenParams.set("client_secret", clientInfo.client_secret);
		}
		const tokenRes = await rawPost(
			tokenUrl, tokenParams.toString(), "application/x-www-form-urlencoded",
		);
		if (!tokenRes.ok) throw new Error(`Token exchange failed: HTTP ${tokenRes.status}`);
		const tokens = await tokenRes.json() as OAuthTokens;

		await provider.saveTokens(tokens);

		// 用新 token 重连
		const existing = this.clients.get(serverName);
		if (existing) await existing.close();

		const client = new McpClient(config, provider);
		this.clients.set(serverName, client);
		try {
			await client.connect();
		} catch (e) {
			console.error(`[MCP] ${serverName} OAuth 连接失败:`, e instanceof Error ? e.message : e);
		}

		return serverName;
	}

	revokeAuth(serverName: string) {
		oauthStore.clear(serverName);
		this.providers.delete(serverName);
	}

	// ── 工具定义 ─────────────────────────────────────────────

	async getToolDefs(): Promise<Record<string, McpToolDef>> {
		const defs: Record<string, McpToolDef> = {};

		for (const [serverName, client] of this.clients) {
			if (!client.connected) continue;
			for (const tool of client.tools) {
				const key = `mcp__${serverName}__${tool.name}`;
				defs[key] = {
					description: tool.description,
					inputSchema: jsonSchema(tool.inputSchema),
					execute: (args: Record<string, unknown>) => this.callTool(serverName, tool.name, args),
				};
			}
		}

		return defs;
	}

	async buildContext(): Promise<string> {
		const parts: string[] = [];

		for (const [name, client] of this.clients) {
			if (!client.connected) continue;
			if (client.instructions) {
				parts.push(`[MCP Server: ${name}]\n${client.instructions}`);
			}
			if (client.tools.length > 0) {
				const toolList = client.tools
					.map((t) => `- mcp__${name}__${t.name}: ${t.description}`)
					.join("\n");
				parts.push(`[MCP Tools: ${name}]\n${toolList}`);
			}
		}

		return parts.length > 0
			? `\n\n--- MCP Servers ---\n${parts.join("\n\n")}`
			: "";
	}

	async callTool(
		serverName: string,
		toolName: string,
		args: Record<string, unknown>,
	): Promise<ToolResult> {
		const client = this.clients.get(serverName);
		if (!client) return { success: false, error: `MCP server "${serverName}" not found` };
		if (!client.connected) return { success: false, error: `MCP server "${serverName}" not connected` };

		try {
			const result = await client.callTool(toolName, args);
			return { success: true, data: result };
		} catch (e) {
			if (isNetworkError(e)) {
				try {
					await client.connect();
					const result = await client.callTool(toolName, args);
					return { success: true, data: result };
				} catch {
					return {
						success: false,
						error: `Network error`,
					};
				}
			}
			return { success: false, error: e instanceof Error ? e.message : String(e) };
		}
	}

	// ── 状态查询 ─────────────────────────────────────────────

	private getOAuthStatus(name: string): OAuthStatus | undefined {
		const client = this.clients.get(name);
		if (client?.needsAuth) return "unauthorized";
		const tokens = oauthStore.getTokens(name);
		if (!tokens) return undefined;
		const savedAt = oauthStore.getSavedAt(name);
		if (tokens.expires_in && savedAt) {
			const expiresAt = savedAt + tokens.expires_in * 1000;
			if (Date.now() > expiresAt) return "expired";
		}
		return "authorized";
	}

	async getStatus(): Promise<McpServerStatus[]> {
		const statuses: McpServerStatus[] = [];
		for (const [name, config] of this.configs) {
			const client = this.clients.get(name);
			statuses.push({
				name,
				url: config.url,
				enabled: config.enabled !== false,
				connected: client?.connected ?? false,
				error: client?.error,
				toolCount: client?.tools.length ?? 0,
				tools: client?.tools ?? [],
				oauthStatus: this.getOAuthStatus(name),
			});
		}
		return statuses;
	}

	getToolCount(): number {
		let count = 0;
		for (const client of this.clients.values()) {
			if (client.connected) count += client.tools.length;
		}
		return count;
	}

	hasServers(): boolean {
		return this.clients.size > 0;
	}
}

export const mcpManager = new McpManager();
