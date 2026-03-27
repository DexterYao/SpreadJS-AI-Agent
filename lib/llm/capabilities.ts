/**
 * 模型能力矩阵。
 *
 * 通过模型名模式匹配判断 vision / reasoning 等能力，
 * 供 env-check、route 等模块消费。
 */

// ─── Vision ─────────────────────────────────────────────

const VISION_CAPABLE_PATTERNS: RegExp[] = [
	// Anthropic — Claude 3 及以上
	/\bclaude-3/i,
	/\bclaude-.*-4/i,
	// OpenAI
	/\bgpt-4o\b/i,
	/\bgpt-4-turbo\b/i,
	/\bo[134]-/i,
	// Google — 所有 Gemini 均为多模态
	/\bgemini/i,
	// GLM — 仅 V 后缀型号
	/\bglm-4v\b/i,
	/\bglm-4\.6v\b/i,
	// Qwen — VL 后缀型号
	/\bqwen2.*vl\b/i,
	/\bqwen-vl\b/i,
	/\bqwen3.*vl\b/i,
];

/** 判断模型是否原生支持图片输入 */
export function isVisionCapable(model: string): boolean {
	return VISION_CAPABLE_PATTERNS.some(p => p.test(model));
}
