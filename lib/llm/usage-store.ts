/**
 * 服务端 token usage 存储。
 * 单用户应用，直接用模块级变量。多用户需换 Redis/DB。
 */

export interface TokenUsage {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
}

let latestUsage: TokenUsage | null = null;

export function setUsage(usage: TokenUsage) {
	latestUsage = usage;
}

export function getUsage(): TokenUsage | null {
	return latestUsage;
}
