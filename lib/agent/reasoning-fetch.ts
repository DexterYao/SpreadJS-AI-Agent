/**
 * Thinking 归一化层。
 *
 * 将 SSE 流中各厂商的 thinking/reasoning 输出统一转换为 `<think>` 标签
 * 包裹的 `content`，配合 AI SDK 的
 * `extractReasoningMiddleware({ tagName: 'think' })` 实现推理内容提取。
 *
 * 适用范围：OpenAI 兼容 provider 路径（GLM / Qwen / Kimi / MiniMax /
 * DeepSeek via SiliconFlow / 其他聚合平台代理）。
 * 原生 SDK 路径（Anthropic / DeepSeek 官方 / Google）由 SDK 内部处理。
 *
 * 已归一化的格式：
 *   - delta.reasoning_content（DeepSeek / GLM / Qwen / Kimi / 硅基流动）
 *   - delta.reasoning（OpenRouter / Together AI）
 *   - delta.thinking_content / delta.thinking（部分 OpenAI 兼容网关，如 gcapi）
 *   - content 中已有的 <thinking>/<thought>/<|begin_of_thought|> 等标签
 *     → 统一替换为 <think>/</think>
 *
 * 已处理的各厂商边界情况：
 *   - GLM: reasoning_content 和 content 可能出现在同一个 chunk（过渡帧）
 *   - GLM: finish_reason 可能返回 "abort" 而非 "stop"
 *   - GLM: 空 thinking block（reasoning_content 全空就结束）
 *   - Qwen/QwQ: reasoning_content 和 content 在 API 层互斥，vLLM 部署可能重叠
 *   - MiniMax: thinking 以 <think> 标签内嵌在 content 中（直接透传，由 middleware 提取）
 *   - 通用: 流在 reasoning 阶段中断（flush 补关闭标签）
 *   - 通用: 无 reasoning 输出的模型（零开销跳过）
 */

// ─── 标签归一化 ──────────────────────────────────────────

/**
 * 非标准 thinking 标签 → <think>/</think> 的替换规则。
 * 按匹配优先级排列，先长后短防止部分匹配。
 * <think> 本身不在列表中，因为它已经是目标格式。
 */
const TAG_REPLACEMENTS: Array<[RegExp, string]> = [
	[/<\|begin_of_thought\|>/g, "<think>"],
	[/<\|end_of_thought\|>/g, "</think>"],
	[/<thinking>/gi, "<think>"],
	[/<\/thinking>/gi, "</think>"],
	[/<thought>/gi, "<think>"],
	[/<\/thought>/gi, "</think>"],
	[/<reasoning>/gi, "<think>"],
	[/<\/reasoning>/gi, "</think>"],
	[/<reason>/gi, "<think>"],
	[/<\/reason>/gi, "</think>"],
];

/** 将 content 中的非标准 thinking 标签统一为 <think> */
function normalizeTags(text: string): string {
	let result = text;
	for (const [pattern, replacement] of TAG_REPLACEMENTS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}

/** 快速检测：行中是否可能包含需要替换的标签（避免无谓的正则运算） */
function mayContainAltTags(line: string): boolean {
	const lower = line.toLowerCase();
	return lower.includes("<thinking") || lower.includes("</thinking")
		|| lower.includes("<thought") || lower.includes("</thought")
		|| lower.includes("<reasoning") || lower.includes("</reasoning")
		|| lower.includes("<reason") || lower.includes("</reason")
		|| lower.includes("<|begin_of_thought|>") || lower.includes("<|end_of_thought|>");
}

// ─── Fetch wrapper ───────────────────────────────────────

export function createReasoningFetch(
	baseFetch: typeof globalThis.fetch = globalThis.fetch,
): typeof globalThis.fetch {
	return async function reasoningFetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		const response = await baseFetch(input, init);

		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("text/event-stream") || !response.body) {
			return response;
		}

		const transformedBody = response.body
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(createReasoningTransform())
			.pipeThrough(new TextEncoderStream());

		return new Response(transformedBody, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	};
}

// ─── SSE Transform ───────────────────────────────────────

/**
 * SSE 行级 TransformStream：thinking 归一化。
 *
 * 职责 1 — 字段归一化：
 *   delta.reasoning_content / delta.reasoning / delta.thinking_content / delta.thinking
 *   → 注入 <think> 标签到 delta.content
 *
 * 职责 2 — 标签归一化：
 *   <thinking>/<thought>/<reasoning>/<reason>/<|begin_of_thought|>
 *   → 统一替换为 <think>/</think>
 *
 * 状态机（字段归一化）：
 *   IDLE → 收到 reasoning 字段 → REASONING
 *   REASONING → 收到 content（无 reasoning 字段）→ IDLE
 *   REASONING → 流结束 → IDLE（flush 补 </think>）
 */
function createReasoningTransform(): TransformStream<string, string> {
	let buffer = "";
	let inReasoning = false;
	let hasReasoningContent = false;

	return new TransformStream({
		transform(chunk, controller) {
			buffer += chunk;
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				controller.enqueue(processLine(line) + "\n");
			}
		},

		flush(controller) {
			if (buffer) {
				controller.enqueue(processLine(buffer));
			}
			if (inReasoning && hasReasoningContent) {
				controller.enqueue("data: " + JSON.stringify({
					choices: [{ delta: { content: "</think>" } }],
				}) + "\n");
			}
		},
	});

	function processLine(line: string): string {
		if (!line.startsWith("data: ") || line === "data: [DONE]") {
			return line;
		}

		// ── 快速路径：无需处理的行跳过 JSON 解析 ──
		const needsFieldNormalization = inReasoning
			|| line.includes("reasoning_content")
			|| line.includes('"reasoning"')
			|| line.includes("thinking_content")
			|| line.includes('"thinking"')
			|| line.includes('"abort"');
		const needsTagNormalization = mayContainAltTags(line);

		if (!needsFieldNormalization && !needsTagNormalization) {
			return line;
		}

		try {
			const data = JSON.parse(line.slice(6));
			const choice = data.choices?.[0];
			if (!choice) return line;

			const delta = choice.delta;
			if (!delta) return line;

			// ── GLM abort → stop ──
			if (choice.finish_reason === "abort") {
				choice.finish_reason = "stop";
			}

			// ── 提取 reasoning 文本（兼容四种字段名）──
			const reasoningText = extractReasoningText(delta);
			const hasReasoning = reasoningText !== null;
			const hasContent = delta.content != null;
			// OpenRouter 等平台可能在 reasoning chunk 中带上 content: ""。
			// 这类空字符串不应被视为“正文已开始”，否则会把每个 reasoning 片段单独闭合成一段。
			const hasVisibleContent = hasContent
				&& (typeof delta.content !== "string" || delta.content.length > 0);

			// ── 情况 1: 仅 reasoning 字段 ──
			if (hasReasoning && !hasVisibleContent) {
				let prefix = "";
				if (!inReasoning) {
					prefix = "<think>";
					inReasoning = true;
				}
				hasReasoningContent = true;
				delta.content = prefix + reasoningText;
				cleanReasoningFields(delta);
				return "data: " + JSON.stringify(data);
			}

			// ── 情况 2: 过渡帧，reasoning + content 同时存在 ──
			if (hasReasoning && hasVisibleContent) {
				let prefix = "";
				if (!inReasoning) {
					prefix = "<think>";
				}
				hasReasoningContent = true;
				delta.content = prefix + reasoningText + "</think>" + delta.content;
				cleanReasoningFields(delta);
				inReasoning = false;
				return "data: " + JSON.stringify(data);
			}

			// ── 情况 3: 仅 content，但之前在 reasoning 中 → 关闭 ──
			if (inReasoning && hasVisibleContent) {
				inReasoning = false;
				if (hasReasoningContent) {
					delta.content = "</think>" + delta.content;
				}
				return "data: " + JSON.stringify(data);
			}

			// ── 情况 4: finish chunk，仍在 reasoning ──
			if (inReasoning && !hasVisibleContent && !hasReasoning && choice.finish_reason) {
				inReasoning = false;
				if (hasReasoningContent) {
					delta.content = "</think>";
				}
				return "data: " + JSON.stringify(data);
			}

			// ── 标签归一化（content 中已有非标准标签）──
			if (needsTagNormalization && hasContent && typeof delta.content === "string") {
				delta.content = normalizeTags(delta.content);
				return "data: " + JSON.stringify(data);
			}

			return "data: " + JSON.stringify(data);
		} catch {
			return line;
		}
	}
}

/**
 * 从 delta 中提取 reasoning/thinking 文本。
 * 优先 reasoning_content（DeepSeek / GLM / Qwen / Kimi / 硅基流动），
 * 其次 reasoning（OpenRouter / Together AI），
 * 再兼容 thinking_content / thinking（部分 OpenAI 兼容网关）。
 * 返回 null 表示无 reasoning 输出。
 */
function extractReasoningText(delta: Record<string, unknown>): string | null {
	if (delta.reasoning_content != null && delta.reasoning_content !== "") {
		return delta.reasoning_content as string;
	}
	if (delta.reasoning != null && delta.reasoning !== "") {
		return delta.reasoning as string;
	}
	if (delta.thinking_content != null && delta.thinking_content !== "") {
		return delta.thinking_content as string;
	}
	if (delta.thinking != null && delta.thinking !== "") {
		return delta.thinking as string;
	}
	return null;
}

/** 清理 delta 中的 reasoning/thinking 字段，避免下游重复处理 */
function cleanReasoningFields(delta: Record<string, unknown>): void {
	delete delta.reasoning_content;
	delete delta.reasoning;
	delete delta.thinking_content;
	delete delta.thinking;
}
