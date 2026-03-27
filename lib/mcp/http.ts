import https from "node:https";
import http from "node:http";

type RawResponse = {
	ok: boolean;
	status: number;
	json: () => Promise<unknown>;
};

/**
 * 绕过 Next.js fetch patch 的原生 HTTP GET。
 * Next.js 16 canary 的 fetch 补丁会导致 OAuth discovery 请求卡死，
 * 必须用 node:https/node:http 直接发请求。
 */
export function rawGet(
	url: string | URL,
	headers?: Record<string, string>,
	timeoutMs = 10_000,
): Promise<RawResponse> {
	return new Promise((resolve, reject) => {
		const u = typeof url === "string" ? new URL(url) : url;
		const mod = u.protocol === "https:" ? https : http;
		const req = mod.get(u, { headers, timeout: timeoutMs }, (res) => {
			const chunks: Buffer[] = [];
			res.on("data", (c: Buffer) => chunks.push(c));
			res.on("end", () => {
				const body = Buffer.concat(chunks).toString();
				const status = res.statusCode ?? 0;
				resolve({
					ok: status >= 200 && status < 300,
					status,
					json: () => Promise.resolve(JSON.parse(body)),
				});
			});
		});
		req.on("error", reject);
		req.on("timeout", () => { req.destroy(); reject(new Error("rawGet timeout")); });
	});
}

/**
 * 绕过 Next.js fetch patch 的原生 HTTP POST。
 * 同 rawGet，避免 Next.js fetch 补丁导致的卡死问题。
 */
export function rawPost(
	url: string | URL,
	payload: string,
	contentType: string,
	timeoutMs = 10_000,
): Promise<RawResponse> {
	return new Promise((resolve, reject) => {
		const u = typeof url === "string" ? new URL(url) : url;
		const mod = u.protocol === "https:" ? https : http;
		const req = mod.request(u, {
			method: "POST",
			headers: {
				"Content-Type": contentType,
				"Content-Length": String(Buffer.byteLength(payload)),
			},
			timeout: timeoutMs,
		}, (res) => {
			const chunks: Buffer[] = [];
			res.on("data", (c: Buffer) => chunks.push(c));
			res.on("end", () => {
				const data = Buffer.concat(chunks).toString();
				const status = res.statusCode ?? 0;
				resolve({
					ok: status >= 200 && status < 300,
					status,
					json: () => Promise.resolve(JSON.parse(data)),
				});
			});
		});
		req.on("error", reject);
		req.on("timeout", () => { req.destroy(); reject(new Error("rawPost timeout")); });
		req.write(payload);
		req.end();
	});
}

const NETWORK_ERROR_PATTERNS = [
	"ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "fetch failed", "network",
];

export function isNetworkError(err: unknown): boolean {
	const msg = err instanceof Error ? err.message : String(err);
	return NETWORK_ERROR_PATTERNS.some((p) => msg.toLowerCase().includes(p.toLowerCase()));
}
