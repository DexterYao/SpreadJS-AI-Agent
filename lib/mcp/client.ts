import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { OAuthRedirectError } from "./oauth-provider";
import { MCP_CLIENT_NAME, MCP_CLIENT_VERSION } from "./types";
import type { McpServerConfig, McpToolInfo } from "./types";

const CONNECT_TIMEOUT_MS = 15_000;
const PROBE_TIMEOUT_MS = 5_000;
const CALL_TIMEOUT_MS = 30_000;

export { UnauthorizedError };

export class McpClient {
	private client: Client;
	private transport?: Transport;
	private _connected = false;
	private _error?: string;
	private _needsAuth = false;
	private _serverCapabilities: Record<string, unknown> = {};
	private _instructions?: string;
	private _tools: McpToolInfo[] = [];

	constructor(
		private config: McpServerConfig,
		private authProvider?: OAuthClientProvider,
	) {
		this.client = new Client(
			{ name: MCP_CLIENT_NAME, version: MCP_CLIENT_VERSION },
			{ capabilities: {} },
		);
	}

	async connect(): Promise<void> {
		const url = new URL(this.config.url);
		const opts: Record<string, unknown> = {
			requestInit: { headers: this.config.headers ?? {} },
		};
		if (this.authProvider) opts.authProvider = this.authProvider;

		if (this.config.type === "sse") {
			console.log(`[MCP:${this.config.name}] SSE`);
			await this.connectWith(new SSEClientTransport(url, opts), CONNECT_TIMEOUT_MS);
			return;
		}

		// auto: 短超时试 HTTP，失败降级 SSE
		try {
			console.log(`[MCP:${this.config.name}] HTTP...`);
			await this.connectWith(new StreamableHTTPClientTransport(url, opts), PROBE_TIMEOUT_MS);
		} catch (e) {
			if (this.isAuthError(e)) throw e;
			console.log(`[MCP:${this.config.name}] HTTP 失败, 降级 SSE...`);
			await this.resetClient();
			await this.connectWith(new SSEClientTransport(url, opts), CONNECT_TIMEOUT_MS);
		}
	}

	private async connectWith(transport: Transport, timeoutMs: number): Promise<void> {
		this.transport = transport;
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			// 双重超时：AbortSignal 给 SDK（可能被忽略），Promise.race 兜底
			const signal = AbortSignal.timeout(timeoutMs);
			const connectPromise = this.client.connect(transport, { signal });
			const timeoutPromise = new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error(`Connect timeout after ${timeoutMs}ms`)), timeoutMs + 1000);
			});
			await Promise.race([connectPromise, timeoutPromise]);
			this._serverCapabilities = this.client.getServerCapabilities() ?? {};
			this._instructions = this.client.getInstructions()?.slice(0, 2048);
			if (this._serverCapabilities.tools) {
				this._tools = await this.discoverTools();
			}
			this._connected = true;
			this._needsAuth = false;
			this._error = undefined;
		} catch (e) {
			this._connected = false;
			if (this.isAuthError(e)) {
				this._needsAuth = true;
				this._error = "需要授权";
			} else {
				this._error = e instanceof Error ? e.message : String(e);
			}
			throw e;
		} finally {
			clearTimeout(timer);
		}
	}

	/** 401、OAuth 重定向、或响应中的 401 状态码都视为需要授权 */
	private isAuthError(e: unknown): boolean {
		if (e instanceof UnauthorizedError || e instanceof OAuthRedirectError) return true;
		const msg = e instanceof Error ? e.message : String(e);
		return /\b401\b/.test(msg);
	}

	private async resetClient(): Promise<void> {
		await this.client.close().catch(() => {});
		this.client = new Client(
			{ name: MCP_CLIENT_NAME, version: MCP_CLIENT_VERSION },
			{ capabilities: {} },
		);
	}

	private async discoverTools(): Promise<McpToolInfo[]> {
		const all: McpToolInfo[] = [];
		let cursor: string | undefined;
		do {
			const res = await this.client.listTools(cursor ? { cursor } : {});
			all.push(...res.tools.map((t) => ({
				name: t.name,
				description: (t.description ?? "").slice(0, 512),
				inputSchema: t.inputSchema as Record<string, unknown>,
			})));
			cursor = res.nextCursor;
		} while (cursor);
		return all;
	}

	async callTool(name: string, args: Record<string, unknown>) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
		try {
			return await this.client.callTool(
				{ name, arguments: args },
				undefined,
				{ signal: controller.signal },
			);
		} finally {
			clearTimeout(timer);
		}
	}

	get connected() { return this._connected; }
	get error() { return this._error; }
	get needsAuth() { return this._needsAuth; }
	get instructions() { return this._instructions; }
	get tools() { return this._tools; }
	get serverCapabilities() { return this._serverCapabilities; }

	async close() {
		try { await this.client.close(); } catch { /* ignore */ }
		this._connected = false;
		this.transport = undefined;
	}
}
