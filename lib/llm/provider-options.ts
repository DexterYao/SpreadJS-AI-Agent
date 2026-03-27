/**
 * 各 LLM Provider 的 providerOptions 构建。
 *
 * 根据 provider 类型和模型名，返回 streamText 所需的 providerOptions，
 * 包括 thinking/reasoning 配置。从 route.ts 抽出以保持路由简洁。
 */

import type { ProviderType } from "./provider";
import { findReasoningParams } from "./reasoning-profiles";

// ─── Reasoning 模型检测 ─────────────────────────────────

/** DeepSeek 推理模型：reasoner 或 V3.2 开启 thinking */
const DEEPSEEK_REASONING_PATTERNS = [
	/\bdeepseek[_-]?r1\b/i,
	/\bdeepseek[_-]?reasoner\b/i,
	/\bdeepseek-chat\b/i,        // V3.2 支持 thinking mode
];

/** Gemini 2.5 系列：使用 thinkingBudget */
const GEMINI_25_PATTERN = /\bgemini-2\.5\b/i;

/** Gemini 3+ 系列：使用 thinkingLevel */
const GEMINI_3_PATTERN = /\bgemini-3/i;

// ─── Provider Options 构建 ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderOptions = Record<string, any>;

/** 构建 streamText 的 providerOptions */
export function buildProviderOptions(
	provider: ProviderType,
	model: string,
	baseURL?: string,
): ProviderOptions | undefined {
	switch (provider) {
		case "anthropic":
			return {
				anthropic: { thinking: { type: "enabled", budgetTokens: 10000 } },
			};

		case "deepseek":
			if (DEEPSEEK_REASONING_PATTERNS.some(p => p.test(model))) {
				return {
					deepseek: { thinking: { type: "enabled" } },
				};
			}
			return undefined;

		case "google":
			return buildGoogleOptions(model);

		case "openai": {
			// 查渠道配置表，注入 reasoning 参数（如 reasoning_effort=high）
			const reasoningParams = findReasoningParams(baseURL, model);
			if (reasoningParams) {
				return { openai: reasoningParams };
			}
			return undefined;
		}

		default:
			return undefined;
	}
}

function buildGoogleOptions(model: string): ProviderOptions | undefined {
	if (GEMINI_3_PATTERN.test(model)) {
		return {
			google: {
				thinkingConfig: { thinkingLevel: "high", includeThoughts: true },
			},
		};
	}
	if (GEMINI_25_PATTERN.test(model)) {
		return {
			google: {
				thinkingConfig: { thinkingBudget: 8192, includeThoughts: true },
			},
		};
	}
	// Gemini 2.0 及更早版本不支持 thinking
	return undefined;
}
