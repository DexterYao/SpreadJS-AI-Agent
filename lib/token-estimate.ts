/**
 * 客户端 token 估算工具。
 * 采用字符级启发式：中日韩字符 ~1.5 token/char，其余 ~0.25 token/char。
 * 精度足够用于上下文占比展示，无需引入 tiktoken 等重依赖。
 */

const CJK_RANGES =
	/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]/;

export function estimateTokens(text: string): number {
	if (!text) return 0;
	let tokens = 0;
	for (const char of text) {
		tokens += CJK_RANGES.test(char) ? 1.5 : 0.25;
	}
	return Math.ceil(tokens);
}

/** 格式化 token 数为人类可读字符串，如 97.1K */
export function formatTokenCount(count: number): string {
	if (count >= 1000) {
		const k = count / 1000;
		return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1)}K`;
	}
	return String(count);
}
