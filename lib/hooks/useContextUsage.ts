import { useEffect, useMemo, useRef, useState } from "react";
import { recoverActiveModule } from "@/lib/agent/recover-module";
import { isAppToolPart, type AppUIMessage } from "@/lib/agent/ui-message";
import { estimateTokens } from "@/lib/token-estimate";
import { MODEL_CONTEXT_WINDOW } from "@/lib/config";
import { baseToolNames, gatewayToolNames, isModuleName, moduleToolMap } from "@/lib/tools/registry";

export interface ContextUsage {
	/** 上下文窗口总大小 */
	total: number;
	/** 已使用 token 数 */
	used: number;
	/** 使用百分比 (0-100) */
	percent: number;
	/** 是否已获取服务端 usage */
	isReal: boolean;
	/** 分类明细 */
	breakdown: {
		systemInstructions: number;
		toolDefinitions: number;
		messages: number;
		toolResults: number;
	};
}

/** 估算系统提示的基础 token 数（静态部分，不含动态注入） */
const SYSTEM_PROMPT_BASE_TOKENS = 1800;
/** 每个工具定义的平均 token 数 */
const AVG_TOKENS_PER_TOOL = 120;

function getActiveToolDefinitionCount(messages: AppUIMessage[], mcpToolCount: number): number {
	const activeModule = recoverActiveModule(messages);
	if (activeModule && isModuleName(activeModule)) {
		return baseToolNames.length + moduleToolMap[activeModule].length + 1 + mcpToolCount;
	}
	return baseToolNames.length + gatewayToolNames.length + mcpToolCount;
}

/** 客户端估算，流式过程中实时更新 */
function estimateUsage(messages: AppUIMessage[], mcpToolCount: number): ContextUsage {
	const total = MODEL_CONTEXT_WINDOW;
	const systemInstructions = SYSTEM_PROMPT_BASE_TOKENS;
	const activeToolDefinitions = getActiveToolDefinitionCount(messages, mcpToolCount);
	const toolDefinitions = activeToolDefinitions * AVG_TOKENS_PER_TOOL;

	let msgTokens = 0;
	let toolResultTokens = 0;

	for (const msg of messages) {
		for (const part of msg.parts) {
			if (part.type === "text") {
				const tokens = estimateTokens(part.text);
				if (msg.role === "assistant" || msg.role === "user") {
					msgTokens += tokens;
				}
			} else if (part.type === "reasoning") {
				// Anthropic thinking tokens 不占上下文，跳过
			} else if (part.type === "file") {
				msgTokens += 85;
			} else if (isAppToolPart(part)) {
				if (part.input != null) {
					msgTokens += estimateTokens(JSON.stringify(part.input));
				}
				if (part.state === "output-available" && part.output != null) {
					const resultStr = typeof part.output === "string"
						? part.output
						: JSON.stringify(part.output);
					toolResultTokens += estimateTokens(resultStr);
				}
			}
		}
	}

	const used = systemInstructions + toolDefinitions + msgTokens + toolResultTokens;
	const percent = Math.min(Math.round((used / total) * 100), 100);

	return {
		total,
		used,
		percent,
		isReal: false,
		breakdown: { systemInstructions, toolDefinitions, messages: msgTokens, toolResults: toolResultTokens },
	};
}

export function useContextUsage(
	messages: AppUIMessage[],
	mcpToolCount = 0,
	/** useChat 的 status，用于检测流结束 */
	chatStatus?: string,
	/** 当前会话 ID，切换时触发 usage 恢复 */
	sessionId?: string,
	/** 当前会话存储的 token 用量（切换会话时从 session 读取） */
	sessionTokenUsage?: { promptTokens: number; contextWindow: number } | null,
	/** 成功获取真实 usage 时的回调（用于持久化到会话） */
	onRealUsageFetched?: (usage: { promptTokens: number; contextWindow: number }) => void,
): ContextUsage {
	// 当前会话流结束后获取到的真实 usage（仅绑定到获取时的会话 ID）
	const [streamUsage, setStreamUsage] = useState<{
		sessionId: string | undefined;
		promptTokens: number;
		contextWindow: number;
	} | null>(null);

	const prevStatusRef = useRef(chatStatus);

	// 流结束时 fetch 真实 usage，并通知外部持久化到会话
	useEffect(() => {
		const wasGenerating = prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
		prevStatusRef.current = chatStatus;

		if (!wasGenerating || chatStatus !== "ready" || messages.length === 0) return;

		const controller = new AbortController();
		fetch("/api/usage", { signal: controller.signal })
			.then(r => r.json())
			.then(data => {
				if (data.usage?.promptTokens > 0) {
					const usage = {
						promptTokens: data.usage.promptTokens,
						contextWindow: data.contextWindow,
					};
					setStreamUsage({ sessionId, ...usage });
					onRealUsageFetched?.(usage);
				}
			})
			.catch(() => { /* abort 或网络失败，回退到估算 */ });

		return () => controller.abort();
	}, [chatStatus, messages.length, onRealUsageFetched, sessionId]);

	// 正确性优先：估算始终基于当前会话的当前消息。
	// 会话切换（sessionId 变化）时会立即重算，避免显示旧会话量级。
	const estimated = useMemo(
		() => {
			// 会话维度参与依赖，强制在切换会话时重算一次。
			void sessionId;
			return estimateUsage(messages, mcpToolCount);
		},
		[messages, sessionId, mcpToolCount],
	);

	// 当前会话优先使用本会话流结束后获取到的 usage；否则回退到会话持久化值。
	const realUsage = useMemo(() => {
		if (streamUsage && streamUsage.sessionId === sessionId) {
			return {
				promptTokens: streamUsage.promptTokens,
				contextWindow: streamUsage.contextWindow,
			};
		}
		return sessionTokenUsage ?? null;
	}, [streamUsage, sessionId, sessionTokenUsage]);

	return useMemo(() => {
		if (realUsage) {
			const total = realUsage.contextWindow;
			const serverUsed = realUsage.promptTokens;
			// 部分 provider（如 GLM）的 inputTokens 只含 system+tools，不含对话消息。
			// 已获取服务端 usage 时仍取 max(server, client)，避免 provider 漏报时显示偏低。
			const clientUsed = estimated.used;
			const used = Math.max(serverUsed, clientUsed);
			const percent = Math.min(Math.round((used / total) * 100), 100);
			return {
				total,
				used,
				percent,
				isReal: true,
				breakdown: estimated.breakdown, // 明细仍用估算（API 不提供分类）
			};
		}

		return estimated;
	}, [realUsage, estimated]);
}
