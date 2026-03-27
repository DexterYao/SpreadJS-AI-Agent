import { getAppToolName, isAppToolPart, type AppUIMessage } from "@/lib/agent/ui-message";
import type { Session } from "@/lib/agent/session-store";
import type { ErrorLogEntry } from "@/lib/logging/types";
import { generateSessionId } from "@/lib/agent/session-store";

// ============================================================================
// 类型定义
// ============================================================================

/** 会话导出文件格式 */
export interface SessionExportFile {
	version: 1;
	exportedAt: string;
	session: Omit<Session, "snapshotMap">;
}

/** 工具调用摘要记录（从 messages 提取） */
export interface ToolCallRecord {
	messageId: string;
	toolName: string;
	input: unknown;
	output: unknown;
	state: string;
}

/** 诊断包格式 */
export interface DiagnosticExportFile {
	version: 1;
	exportedAt: string;
	environment: {
		userAgent: string;
		url: string;
		// timestamp 已移除：与 exportedAt 重复
	};
	session: Omit<Session, "snapshotMap">;
	toolCallSummary: ToolCallRecord[];
	serverLogs: ErrorLogEntry[];
}

// ============================================================================
// 会话导出
// ============================================================================

/**
 * 将 Session 序列化为导出 JSON 字符串。
 * snapshotMap 不导出（快照是 IndexedDB 大对象，跨设备无意义）。
 */
export function exportSessionToJson(session: Session): string {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { snapshotMap: _snap, ...sessionData } = session;
	const file: SessionExportFile = {
		version: 1,
		exportedAt: new Date().toISOString(),
		session: sessionData,
	};
	return JSON.stringify(file, null, 2);
}

/**
 * 触发浏览器下载会话 JSON 文件。
 * 文件名：<会话标题>-<YYYY-MM-DD>.json（特殊字符替换为 -）
 */
export function downloadSessionFile(session: Session): void {
	const json = exportSessionToJson(session);
	const date = new Date().toISOString().slice(0, 10);
	const safeTitle = session.title.replace(/[\\/:*?"<>|]/g, "-").slice(0, 60);
	const filename = `${safeTitle}-${date}.json`;
	triggerDownload(json, filename, "application/json");
}

// ============================================================================
// 会话导入
// ============================================================================

/**
 * 解析并校验导入文件的 JSON 字符串。
 * 失败时抛出包含可读 message 的 Error。
 * 诊断包（含 toolCallSummary / serverLogs 字段）会被拒绝并给出明确提示。
 */
export function parseSessionImportFile(json: string): SessionExportFile {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		throw new Error("文件不是合法的 JSON 格式");
	}

	if (!parsed || typeof parsed !== "object") {
		throw new Error("文件内容损坏：根节点不是对象");
	}

	const obj = parsed as Record<string, unknown>;

	if (obj.version !== 1) {
		throw new Error(
			`文件格式版本不兼容（期望 version: 1，实际 version: ${obj.version}）`,
		);
	}

	// 诊断包含有 toolCallSummary / serverLogs 字段，与会话文件结构不同，拒绝导入
	if ("toolCallSummary" in obj || "serverLogs" in obj) {
		throw new Error(
			"此文件是诊断包，无法作为会话导入。请选择通过「导出会话」生成的文件（不含 toolCallSummary 字段）。",
		);
	}

	if (!obj.session || typeof obj.session !== "object") {
		throw new Error("文件内容损坏：缺少 session 字段");
	}

	const session = obj.session as Record<string, unknown>;

	if (!Array.isArray(session.messages)) {
		throw new Error("文件内容损坏：缺少消息记录（messages）");
	}

	if (typeof session.id !== "string" || !session.id) {
		throw new Error("文件内容损坏：缺少会话 ID");
	}

	return parsed as SessionExportFile;
}

/**
 * 将导入文件转换为可存储的 Session。
 * - 生成全新 sessionId，避免与本地会话冲突
 * - snapshotMap 置空
 * - updatedAt 更新为当前时间
 * - createdAt 保留原值
 */
export function importFileToSession(file: SessionExportFile): Session {
	return {
		...file.session,
		id: generateSessionId(),
		snapshotMap: {},
		updatedAt: Date.now(),
	};
}

// ============================================================================
// 诊断包
// ============================================================================

/**
 * 从 AppUIMessage[] 中提取工具调用摘要。
 * 遍历所有 assistant 消息的 parts，提取工具调用记录。
 */
export function extractToolCallSummary(messages: AppUIMessage[]): ToolCallRecord[] {
	const records: ToolCallRecord[] = [];

	for (const message of messages) {
		if (message.role !== "assistant") continue;

		for (const part of message.parts) {
			if (!isAppToolPart(part)) continue;

			records.push({
				messageId: message.id,
				toolName: getAppToolName(part),
				input: part.input ?? null,
				output: part.output ?? null,
				state: part.state ?? "unknown",
			});
		}
	}

	return records;
}

/**
 * 组装诊断包 JSON 字符串。
 * serverLogs 拉取失败时传空数组，不阻断导出。
 */
export function exportDiagnosticToJson(
	session: Session,
	serverLogs: ErrorLogEntry[],
): string {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { snapshotMap: _snap, ...sessionData } = session;
	const exportedAt = new Date().toISOString();

	const file: DiagnosticExportFile = {
		version: 1,
		exportedAt,
		environment: {
			userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
			url: typeof window !== "undefined" ? window.location.href : "unknown",
		},
		session: sessionData,
		toolCallSummary: extractToolCallSummary(session.messages),
		serverLogs,
	};

	return JSON.stringify(file, null, 2);
}

/**
 * 触发浏览器下载诊断包 JSON 文件。
 * 文件名：spreadjs-agent-diagnostic-<ISO时间>.json
 */
export function downloadDiagnosticFile(
	session: Session,
	serverLogs: ErrorLogEntry[],
): void {
	const json = exportDiagnosticToJson(session, serverLogs);
	const ts = new Date().toISOString().replace(/[:.]/g, "-");
	const filename = `spreadjs-agent-diagnostic-${ts}.json`;
	triggerDownload(json, filename, "application/json");
}

// ============================================================================
// 内部工具
// ============================================================================

function triggerDownload(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	// 必须附加到 DOM，否则 Firefox 不触发下载
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	// 稍后释放 URL，给浏览器时间处理下载请求
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
