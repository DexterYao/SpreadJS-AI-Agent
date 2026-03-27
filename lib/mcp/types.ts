import { z } from "zod/v4";

export const MCP_CLIENT_NAME = "spreadjs-agent";
export const MCP_CLIENT_VERSION = "0.1.0";

// ============================================================================
// 配置模型
// ============================================================================

const McpServerEntrySchema = z.object({
	url: z.url(),
	enabled: z.boolean().optional().default(true),
	type: z.enum(["http", "sse"]).optional().default("http"),
	authType: z.enum(["headers", "oauth"]).optional().default("headers"),
	// headers 认证
	headers: z.record(z.string(), z.string()).optional(),
	// OAuth 认证
	clientId: z.string().optional(),
	clientSecret: z.string().optional(),
	scopes: z.string().optional(),
});

export const McpConfigSchema = z.object({
	mcpServers: z.record(
		z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/),
		McpServerEntrySchema,
	),
});

export type McpConfig = z.infer<typeof McpConfigSchema>;

// ============================================================================
// 运行时类型
// ============================================================================

export type AuthType = "headers" | "oauth";
export type TransportType = "http" | "sse";

export interface McpServerConfig {
	name: string;
	url: string;
	type?: TransportType;
	authType?: AuthType;
	headers?: Record<string, string>;
	clientId?: string;
	clientSecret?: string;
	scopes?: string;
	enabled?: boolean;
}

export interface McpToolInfo {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
}

export type OAuthStatus = "unauthorized" | "authorized" | "expired";

export interface McpServerStatus {
	name: string;
	url: string;
	enabled: boolean;
	connected: boolean;
	error?: string;
	toolCount: number;
	tools: McpToolInfo[];
	oauthStatus?: OAuthStatus;
}

export interface ToolResult {
	success: boolean;
	data?: unknown;
	error?: string;
}
