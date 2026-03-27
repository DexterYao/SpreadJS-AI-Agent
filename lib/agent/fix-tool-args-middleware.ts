/**
 * AI SDK model middleware：修复 SiliconFlow / GLM-4.7 streaming 中
 * tool call arguments 被截断的问题。
 *
 * 症状：finish_reason="tool_calls" 的 SSE chunk 不包含 tool_calls 字段，
 * 导致最外层的 `}` 永远无法进入累积 buffer，`isParsableJson` 始终为 false，
 * OpenAI provider 不发射 `tool-call` chunk，客户端永远卡在 input-streaming。
 *
 * 修复策略：在 provider stream 的 flush 阶段，对每个 hasFinished===false 的
 * tool call 尝试补齐缺失的 `}`，使其成为合法 JSON。
 */
import type { LanguageModelMiddleware } from "ai";

interface ToolCallAccum {
	id: string;
	name: string;
	arguments: string;
	hasFinished: boolean;
}

export const fixToolArgsMiddleware: LanguageModelMiddleware = {
	specificationVersion: "v3",

	wrapStream: async ({ doStream }) => {
		const result = await doStream();
		const toolCalls: ToolCallAccum[] = [];

		// TransformStream 内部对 chunk 做 duck-typing，
		// 外层类型由 LanguageModelMiddleware 的返回值保证。
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const fixStream = new TransformStream<any, any>({
			transform(chunk, controller) {
				if (chunk.type === "tool-input-start") {
					toolCalls.push({
						id: chunk.id,
						name: chunk.toolName,
						arguments: "",
						hasFinished: false,
					});
				} else if (chunk.type === "tool-input-delta") {
					const tc = toolCalls.find((t: ToolCallAccum) => t.id === chunk.id);
					if (tc && !tc.hasFinished) {
						tc.arguments += chunk.delta ?? "";
					}
				} else if (chunk.type === "tool-input-end") {
					const tc = toolCalls.find((t: ToolCallAccum) => t.id === chunk.id);
					if (tc) tc.hasFinished = true;
				}
				controller.enqueue(chunk);
			},

			flush(controller) {
				for (const tc of toolCalls) {
					if (tc.hasFinished) continue;
					const fixed = tryFixJson(tc.arguments);
					if (fixed === null) {
						// 无法修复 JSON：仍然发出 tool-call，让 SDK 的 parseToolCall
						// 将其标记为 invalid，产生 tool-error → 客户端触发
						// sendAutomaticallyWhen → AI 收到错误上下文后自动重试。
						console.warn(`[fixToolArgs] 无法修复 tool call ${tc.name} 的 JSON，交由 SDK 错误处理:`, tc.arguments.slice(-80));
						controller.enqueue({ type: "tool-input-end", id: tc.id });
						controller.enqueue({
							type: "tool-call",
							toolCallId: tc.id,
							toolName: tc.name,
							input: tc.arguments,
						});
						tc.hasFinished = true;
						continue;
					}
					console.warn(`[fixToolArgs] 修复 ${tc.name}: 补齐 ${fixed.length - tc.arguments.length} 个字符`);
					controller.enqueue({ type: "tool-input-end", id: tc.id });
					controller.enqueue({
						type: "tool-call",
						toolCallId: tc.id,
						toolName: tc.name,
						input: fixed,
					});
					tc.hasFinished = true;
				}
			},
		});

		return { ...result, stream: result.stream.pipeThrough(fixStream) };
	},
};

/** 尝试通过补齐闭合括号来修复不完整的 JSON */
function tryFixJson(input: string): string | null {
	if (isValid(input)) return input;

	let attempt = input;
	for (let i = 0; i < 5; i++) {
		const openBraces = (attempt.match(/{/g) || []).length;
		const closeBraces = (attempt.match(/}/g) || []).length;
		const openBrackets = (attempt.match(/\[/g) || []).length;
		const closeBrackets = (attempt.match(/]/g) || []).length;

		if (openBrackets > closeBrackets) {
			attempt += "]";
		} else if (openBraces > closeBraces) {
			attempt += "}";
		} else {
			break;
		}

		if (isValid(attempt)) return attempt;
	}
	return null;
}

function isValid(s: string): boolean {
	try { JSON.parse(s); return true; } catch { return false; }
}
