/** 环境变量检测 — 缺失时输出 warning 但不阻塞启动 */

import { isVisionCapable } from "@/lib/llm/capabilities";
import { LLM_CONFIG } from "@/lib/config";

const REQUIRED_ENV_VARS = ["LLM_API_KEY"] as const;

export interface EnvCheckResult {
	available: boolean;
	missing: string[];
	visionAvailable: boolean;
}

let _cached: EnvCheckResult | null = null;

export function checkEnv(): EnvCheckResult {
	if (_cached) return _cached;

	const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
	// VISION_MODEL 显式配置，或主模型本身支持多模态
	const visionAvailable = !!process.env.VISION_MODEL || isVisionCapable(LLM_CONFIG.model);

	if (missing.length > 0) {
		console.warn(
			`[env-check] ⚠ 缺少关键环境变量: ${missing.join(", ")}。AI 功能将不可用。`,
		);
	}
	if (!visionAvailable) {
		console.warn("[env-check] ⚠ 主模型不支持多模态且未配置 VISION_MODEL，图片附件功能不可用。");
	}

	_cached = { available: missing.length === 0, missing, visionAvailable };
	return _cached;
}

// 模块加载时立即检测
checkEnv();
