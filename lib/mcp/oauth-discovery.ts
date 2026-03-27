import { rawGet } from "./http";

export interface OAuthServerInfo {
	authorizationServerUrl: string;
	authorizationServerMetadata: Record<string, unknown>;
}

const MCP_PROTOCOL_VERSION = "2025-03-26";
const CACHE_TTL = 5 * 60_000;

const cache = new Map<string, { info: OAuthServerInfo; ts: number }>();

/**
 * OAuth Authorization Server discovery（带 5 分钟缓存）。
 * 使用 rawGet 绕过 Next.js fetch patch。
 */
export async function discoverOAuthServer(serverUrl: string): Promise<OAuthServerInfo> {
	const cached = cache.get(serverUrl);
	if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.info;

	const info = await doDiscover(serverUrl);
	cache.set(serverUrl, { info, ts: Date.now() });
	return info;
}

/**
 * RFC 9728 Protected Resource Metadata + RFC 8414 AS Metadata。
 */
async function doDiscover(serverUrl: string): Promise<OAuthServerInfo> {
	const origin = new URL("/", serverUrl).href;
	const pathname = new URL(serverUrl).pathname.replace(/\/$/, "");
	const headers = { "MCP-Protocol-Version": MCP_PROTOCOL_VERSION };

	// 1. RFC 9728 Protected Resource Metadata（可选）
	let authorizationServerUrl = origin;
	try {
		let res = await rawGet(
			new URL(`/.well-known/oauth-protected-resource${pathname}`, origin),
			headers,
		);
		if (res.status === 404 && pathname) {
			res = await rawGet(
				new URL("/.well-known/oauth-protected-resource", origin),
				headers,
			);
		}
		if (res.ok) {
			const meta = await res.json() as Record<string, unknown>;
			const servers = meta.authorization_servers as string[] | undefined;
			if (servers?.[0]) {
				authorizationServerUrl = servers[0];
			}
		}
	} catch {
		// RFC 9728 not supported, continue with fallback
	}

	// 2. RFC 8414 Authorization Server Metadata
	console.log(`[MCP:OAuth] discovering AS metadata at ${authorizationServerUrl}`);
	const asRes = await rawGet(
		new URL("/.well-known/oauth-authorization-server", authorizationServerUrl),
		headers,
	);
	if (!asRes.ok) {
		throw new Error(`OAuth AS metadata returned ${asRes.status}`);
	}
	const authorizationServerMetadata = await asRes.json() as Record<string, unknown>;

	return { authorizationServerUrl, authorizationServerMetadata };
}
