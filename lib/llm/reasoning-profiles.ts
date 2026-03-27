/**
 * OpenAI 兼容渠道的 reasoning 参数配置表。
 *
 * 不同平台/渠道对同一模型的 thinking 激活参数不同，无法从模型名单独推断。
 * 这里用「baseURL 域名模式 + 模型名模式」二维匹配，返回需要透传的额外请求参数。
 *
 * 匹配规则：
 *   - urlPattern 匹配 baseURL（域名部分）
 *   - modelPattern 匹配模型名（可选，不填则匹配该渠道所有模型）
 *   - params 透传到 providerOptions.openai（AI SDK 会将其合并到请求 body）
 *
 * 维护说明：
 *   新渠道/模型实测后在此追加一条记录即可，无需改动其他代码。
 *   实测工具：scripts/probe-gcapi-variants.ts（改 API_KEY/BASE_URL/MODEL 后运行）
 */

export interface ReasoningProfile {
	/** 匹配 baseURL，支持正则 */
	urlPattern: RegExp;
	/** 匹配模型名，支持正则；不填则匹配该渠道所有模型 */
	modelPattern?: RegExp;
	/** 透传到请求 body 的额外参数 */
	params: Record<string, unknown>;
	/** 备注：渠道名 + 实测日期 */
	note: string;
}

/**
 * 已知渠道的 reasoning 参数配置。
 * 按优先级排列，第一条匹配生效。
 *
 * ─── 如何添加新渠道 ──────────────────────────────────────
 * 1. 运行 scripts/probe-gcapi-variants.ts（改变量后）探测参数
 * 2. 在下方追加一条 ReasoningProfile
 * ─────────────────────────────────────────────────────────
 *
 * ─── 已知「无需额外参数」的渠道 ─────────────────────────
 * 以下渠道的 reasoning 模型会自动在 delta 里返回 reasoning 字段，
 * 无需传额外参数，故不在表中（避免误配置）：
 *   - 硅基流动 (siliconflow.cn)：delta.reasoning_content 自动返回
 *   - OpenRouter (openrouter.ai)：delta.reasoning 自动返回
 *   - Together AI (together.ai)：delta.reasoning 自动返回
 *   - MiniMax：content 中内嵌 <think> 标签，直接透传
 * ─────────────────────────────────────────────────────────
 *
 * ─── params 字段命名规则 ────────────────────────────────
 * @ai-sdk/openai provider 通过 providerOptions.openai 接收参数，
 * 字段名必须用驼峰（camelCase），provider 内部会转为 snake_case 写入请求 body。
 * 例：{ reasoningEffort: "high" } → 请求 body 中为 reasoning_effort: "high"
 * 直接传 snake_case（如 reasoning_effort）会被 zod schema 忽略，不生效。
 * ─────────────────────────────────────────────────────────
 */
export const REASONING_PROFILES: ReasoningProfile[] = [
	// ── gcapi.cn ──────────────────────────────────────────────────────────
	// 实测 2026-03-24：glm-5 需传 reasoning_effort=high 才返回 reasoning_content
	// 无效参数：enable_thinking / thinking / thinking_budget / include_reasoning
	{
		urlPattern: /gcapi\.cn/i,
		modelPattern: /\bglm/i,
		params: { reasoningEffort: "high" },
		note: "gcapi glm 系列 @ 2026-03-24",
	},

	// ── 百炼 (阿里云) ───────────────────────────────────────────────────────
	// 百炼的 QwQ / Qwen3 thinking 模型需传 enable_thinking=true
	// 参考：https://help.aliyun.com/zh/model-studio/thinking-mode
	// 注：Qwen3-235B-A22B 等非 thinking 版本不需要此参数
	{
		urlPattern: /dashscope\.aliyuncs\.com/i,
		modelPattern: /\b(qwq|qwen.*thinking)\b/i,
		params: { enable_thinking: true },
		note: "百炼 QwQ/Qwen-thinking @ 待实测",
	},

	// ── 智谱官方 (bigmodel.cn / open.bigmodel.cn) ──────────────────────────
	// 智谱官方 API 的 GLM-Z1 系列支持 thinking，参数同 gcapi
	// 参考：https://bigmodel.cn/dev/howuse/thinking
	{
		urlPattern: /bigmodel\.cn/i,
		modelPattern: /\bglm-z1\b/i,
		params: { reasoningEffort: "high" },
		note: "智谱官方 glm-z1 @ 待实测",
	},
];

/**
 * 根据 baseURL + 模型名查找匹配的 reasoning 参数。
 * 返回需要透传的 params，无匹配则返回 undefined。
 */
export function findReasoningParams(
	baseURL: string | undefined,
	model: string,
): Record<string, unknown> | undefined {
	if (!baseURL) return undefined;
	for (const profile of REASONING_PROFILES) {
		if (!profile.urlPattern.test(baseURL)) continue;
		if (profile.modelPattern && !profile.modelPattern.test(model)) continue;
		return profile.params;
	}
	return undefined;
}
