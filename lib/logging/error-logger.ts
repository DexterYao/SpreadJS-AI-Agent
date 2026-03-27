import fs from "node:fs";
import path from "node:path";
import type { ErrorLogEntry, ErrorLevel, ErrorSource } from "./types";

const LOGS_DIR = path.resolve(process.cwd(), "logs");
const BUFFER_LIMIT = 20;
const FLUSH_INTERVAL_MS = 30_000; // 30 秒

/**
 * 服务端错误日志收集器。
 *
 * - 内存缓冲，达到阈值或定时器触发后写出到 `logs/errors-YYYY-MM-DD.jsonl`
 * - 写出后清空内存缓冲
 * - 进程退出时自动 flush
 */
export class ErrorLogger {
	private buffer: ErrorLogEntry[] = [];
	private timer: ReturnType<typeof setInterval> | null = null;

	constructor() {
		this.ensureDir();
		this.startTimer();
		this.registerShutdownHooks();
	}

	// ─── 公共 API ─────────────────────────────────────────

	/** 记录一条错误 */
	log(
		source: ErrorSource,
		message: string,
		opts?: {
			level?: ErrorLevel;
			error?: unknown;
			details?: Record<string, unknown>;
		},
	): void {
		const entry: ErrorLogEntry = {
			timestamp: new Date().toISOString(),
			level: opts?.level ?? "error",
			source,
			message,
		};
		if (opts?.details) entry.details = opts.details;
		if (opts?.error instanceof Error && opts.error.stack) {
			entry.stack = opts.error.stack;
		}
		this.buffer.push(entry);
		if (this.buffer.length >= BUFFER_LIMIT) {
			this.flush();
		}
	}

	/** 从 catch 块快速记录错误 */
	capture(source: ErrorSource, error: unknown, details?: Record<string, unknown>): void {
		const message = error instanceof Error ? error.message : String(error);
		this.log(source, message, { error, details });
	}

	/** 记录工具执行结果中的错误（success: false） */
	captureToolResult(
		toolName: string,
		result: { success?: boolean; error?: string; data?: unknown },
	): void {
		if (result.success === false && result.error) {
			this.log("tool/result", result.error, {
				level: "warn",
				details: { toolName },
			});
		}
	}

	/** 将缓冲区写出到日志文件 */
	flush(): void {
		if (this.buffer.length === 0) return;
		const entries = this.buffer.splice(0);
		const filePath = this.getFilePath();

		try {
			const lines = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
			fs.appendFileSync(filePath, lines, "utf-8");
		} catch {
			// 写文件失败时回填缓冲区，避免丢失
			this.buffer.unshift(...entries);
		}
	}

	/** 获取当前缓冲区大小（用于测试/监控） */
	get bufferSize(): number {
		return this.buffer.length;
	}

	/** 销毁定时器（用于测试清理） */
	destroy(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		this.flush();
	}

	// ─── 内部实现 ─────────────────────────────────────────

	private getFilePath(): string {
		const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
		return path.join(LOGS_DIR, `errors-${date}.jsonl`);
	}

	private ensureDir(): void {
		try {
			if (!fs.existsSync(LOGS_DIR)) {
				fs.mkdirSync(LOGS_DIR, { recursive: true });
			}
		} catch {
			// 目录已存在或无权限，静默处理
		}
	}

	private startTimer(): void {
		this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
		// 不阻塞 Node.js 进程退出
		if (this.timer.unref) this.timer.unref();
	}

	private registerShutdownHooks(): void {
		const onExit = () => this.flush();
		process.on("beforeExit", onExit);
		process.on("SIGTERM", onExit);
		process.on("SIGINT", onExit);
	}
}
