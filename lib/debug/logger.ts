import type { DebugLogEntry, DebugSession, DebugStage } from "./types";

/**
 * Debug 执行日志收集器。
 * 每个 stage 自动计时、捕获异常、记录 input/output。
 */
export class DebugLogger {
	private logs: DebugLogEntry[] = [];
	private startTime = performance.now();
	private stopped = false;

	/** 同步阶段执行 — 计时 + 捕获异常 */
	stage<T>(name: DebugStage, fn: () => T): T | null {
		if (this.stopped) return null;
		const t0 = performance.now();
		try {
			const result = fn();
			this.logs.push({
				stage: name,
				status: "ok",
				durationMs: round(performance.now() - t0),
				output: sanitize(result),
			});
			return result;
		} catch (e) {
			this.stopped = true;
			this.logs.push({
				stage: name,
				status: "error",
				durationMs: round(performance.now() - t0),
				error: e instanceof Error ? e.message : String(e),
			});
			return null;
		}
	}

	/** 异步阶段执行 */
	async asyncStage<T>(name: DebugStage, fn: () => Promise<T>): Promise<T | null> {
		if (this.stopped) return null;
		const t0 = performance.now();
		try {
			const result = await fn();
			this.logs.push({
				stage: name,
				status: "ok",
				durationMs: round(performance.now() - t0),
				output: sanitize(result),
			});
			return result;
		} catch (e) {
			this.stopped = true;
			this.logs.push({
				stage: name,
				status: "error",
				durationMs: round(performance.now() - t0),
				error: e instanceof Error ? e.message : String(e),
			});
			return null;
		}
	}

	/** 当前是否有 error 阶段 */
	hasError(): boolean {
		return this.stopped;
	}

	/** 组装 DebugSession */
	toSession(toolName: string, result?: unknown): DebugSession {
		return {
			toolName,
			startedAt: Date.now(),
			logs: this.logs,
			result: sanitize(result),
			totalMs: round(performance.now() - this.startTime),
		};
	}
}

function round(ms: number): number {
	return Math.round(ms * 100) / 100;
}

/** 安全序列化：避免循环引用、DOM 节点等不可序列化对象 */
function sanitize(value: unknown): unknown {
	if (value === undefined || value === null) return value;
	try {
		return JSON.parse(JSON.stringify(value));
	} catch {
		return String(value);
	}
}
