import type { LanguageModelUsage } from "ai";
import { setUsage } from "@/lib/llm/usage-store";

/**
 * 每次请求的 token 用量追踪。
 *
 * - recordStep：每步记录 inputTokens（最后一步的值才是真实上下文占用）
 * - finalize：汇总写入 usage store + 输出 cache 命中指标
 */
export class UsageTracker {
	private lastStepInputTokens = 0;

	/** onStepFinish 调用：记录本步 inputTokens */
	recordStep(usage: { inputTokens?: number } | undefined): void {
		if (usage?.inputTokens) {
			this.lastStepInputTokens = usage.inputTokens;
		}
	}

	/** onFinish 调用：汇总并写入 usage store + 输出 cache 指标 */
	finalize(totalUsage: LanguageModelUsage): void {
		const promptTokens = this.lastStepInputTokens || (totalUsage.inputTokens ?? 0);
		console.log(`[usage] lastStep: ${this.lastStepInputTokens}, total: ${JSON.stringify(totalUsage)}`);
		setUsage({
			promptTokens,
			completionTokens: totalUsage.outputTokens ?? 0,
			totalTokens: totalUsage.totalTokens ?? 0,
		});

		// cache 指标从 AI SDK 标准化的 inputTokenDetails 读取（跨 provider 通用）
		const { cacheReadTokens, cacheWriteTokens } = totalUsage.inputTokenDetails;
		if (cacheReadTokens != null || cacheWriteTokens != null) {
			console.log(`[cache] write=${cacheWriteTokens ?? 0} read=${cacheReadTokens ?? 0}`);
		}
	}
}
