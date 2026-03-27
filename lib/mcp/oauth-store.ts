import type {
	OAuthTokens,
	OAuthClientInformationMixed,
} from "@modelcontextprotocol/sdk/shared/auth.js";

/** 服务端内存 OAuth 存储，按 serverName 隔离 */
class OAuthStore {
	private tokens = new Map<string, OAuthTokens>();
	private tokenSavedAt = new Map<string, number>();
	private verifiers = new Map<string, string>();
	private clientInfo = new Map<string, OAuthClientInformationMixed>();
	private stateMap = new Map<string, { serverName: string; createdAt: number }>();

	private static STATE_TTL = 10 * 60_000; // 10 minutes

	// ── tokens ───────────────────────────────────────────────
	getTokens(name: string) { return this.tokens.get(name); }
	setTokens(name: string, t: OAuthTokens) {
		this.tokens.set(name, t);
		this.tokenSavedAt.set(name, Date.now());
	}
	getSavedAt(name: string) { return this.tokenSavedAt.get(name); }
	hasTokens(name: string) { return this.tokens.has(name); }

	// ── code verifier ────────────────────────────────────────
	getVerifier(name: string) { return this.verifiers.get(name); }
	setVerifier(name: string, v: string) { this.verifiers.set(name, v); }

	// ── client info（动态注册） ───────────────────────────────
	getClientInfo(name: string) { return this.clientInfo.get(name); }
	setClientInfo(name: string, info: OAuthClientInformationMixed) {
		this.clientInfo.set(name, info);
	}

	// ── state → serverName 映射（带 TTL） ────────────────────
	setState(state: string, name: string) {
		this.stateMap.set(state, { serverName: name, createdAt: Date.now() });
		if (this.stateMap.size > 10) this.sweepExpiredStates();
	}
	resolveState(state: string) {
		const entry = this.stateMap.get(state);
		if (!entry) return undefined;
		this.stateMap.delete(state);
		if (Date.now() - entry.createdAt > OAuthStore.STATE_TTL) return undefined;
		this.sweepExpiredStates();
		return entry.serverName;
	}

	private sweepExpiredStates() {
		const now = Date.now();
		for (const [key, entry] of this.stateMap) {
			if (now - entry.createdAt > OAuthStore.STATE_TTL) {
				this.stateMap.delete(key);
			}
		}
	}

	// ── 清除单个 server 的所有数据 ───────────────────────────
	clear(name: string) {
		this.tokens.delete(name);
		this.tokenSavedAt.delete(name);
		this.verifiers.delete(name);
		this.clientInfo.delete(name);
		for (const [key, entry] of this.stateMap) {
			if (entry.serverName === name) this.stateMap.delete(key);
		}
	}
}

export const oauthStore = new OAuthStore();
