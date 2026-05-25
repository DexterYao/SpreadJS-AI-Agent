import { generateObject } from "ai";
import { z } from "zod";
import { buildLLM } from "@/lib/llm/provider";
import { LLM_CONFIG } from "@/lib/config";
import { errorLogger } from "@/lib/logging";

const skillLlm = buildLLM({
model: LLM_CONFIG.model,
apiKey: process.env[LLM_CONFIG.apiKeyEnv],
baseURL: LLM_CONFIG.baseURL,
});

const skillSchema = z.object({
name: z.string().min(1).max(60),
description: z.string().min(1).max(300),
steps: z.array(z.object({
toolName: z.string().min(1),
purpose: z.string().min(1).max(200),
inputSummary: z.string().max(300).optional(),
})).min(1),
});

type ToolCall = {
toolName: string;
input?: unknown;
userRequest?: string;
};

function summarizeInput(input: unknown): string | undefined {
if (input === undefined) return undefined;
try {
const text = JSON.stringify(input);
if (!text) return undefined;
return text.length > 220 ? `${text.slice(0, 220)}...` : text;
} catch {
return undefined;
}
}

function summarizeUserRequest(text: string | undefined): string | undefined {
if (!text) return undefined;
const normalized = text.replace(/\s+/g, " ").trim();
if (!normalized) return undefined;
return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
}

function extractTextParts(parts: unknown): string {
if (!Array.isArray(parts)) return "";
return parts
.map((part) => {
if (!part || typeof part !== "object") return "";
const p = part as { type?: unknown; text?: unknown };
if (p.type !== "text" || typeof p.text !== "string") return "";
return p.text;
})
.filter(Boolean)
.join(" ");
}

function extractToolCalls(messages: unknown): ToolCall[] {
if (!Array.isArray(messages)) return [];
const calls: ToolCall[] = [];
let lastUserRequest = "";

for (const msg of messages) {
if (!msg || typeof msg !== "object") continue;
const role = (msg as { role?: unknown }).role;
const parts = (msg as { parts?: unknown }).parts;
if (role === "user") {
lastUserRequest = extractTextParts(parts);
continue;
}
if (role !== "assistant") continue;
if (!Array.isArray(parts)) continue;

for (const part of parts) {
if (!part || typeof part !== "object") continue;
const p = part as {
type?: unknown;
state?: unknown;
toolName?: unknown;
input?: unknown;
output?: unknown;
};
if (p.state !== "output-available") continue;

if (p.output && typeof p.output === "object") {
const out = p.output as { success?: unknown };
if (out.success === false) continue;
}

let toolName: string | null = null;
if (p.type === "dynamic-tool" && typeof p.toolName === "string") {
toolName = p.toolName;
} else if (typeof p.type === "string" && p.type.startsWith("tool-")) {
toolName = p.type.slice(5);
}
if (!toolName) continue;
calls.push({ toolName, input: p.input, userRequest: lastUserRequest });
}
}

return calls;
}

export async function POST(req: Request) {
let messages: unknown;
try {
({ messages } = await req.json());
} catch {
return Response.json({ error: "Invalid request body" }, { status: 400 });
}

const toolCalls = extractToolCalls(messages);
if (toolCalls.length === 0) {
return Response.json({ error: "No completed tool calls found" }, { status: 400 });
}

const toolLines = toolCalls
.map((call, idx) => {
const inputSummary = summarizeInput(call.input);
const userRequest = summarizeUserRequest(call.userRequest);
return `${idx + 1}. toolName=${call.toolName}${inputSummary ? `, inputSummary=${inputSummary}` : ""}${userRequest ? `, userRequest=${userRequest}` : ""}`;
})
.join("\n");

try {
const { object } = await generateObject({
model: skillLlm,
schema: skillSchema,
system: `你是一个“操作流程提炼助手”。
请把给定的工具调用序列整理为可复用的 Skill。
要求：
- 严格保持步骤顺序
- steps[].toolName 必须使用输入里出现过的工具名
- purpose 要说明这一步在流程中的目的（中文，简洁）
- inputSummary 只保留关键输入意图，不要复制冗长参数
- 如果 userRequest 里有明确要求（如颜色、阈值、目标文本、格式），必须体现在对应步骤的 inputSummary 中并原样保留其关键值
- name 和 description 要可读、可复用
- 最终输出必须是合法的 json 对象`,
prompt: `以下是一次对话中按时间顺序成功执行的工具调用（每一步可能附带用户诉求 userRequest）：\n${toolLines}\n\n请生成一个 Skill，并仅输出符合 schema 的 json 对象。`,
maxOutputTokens: 1200,
});

return Response.json(object);
} catch (e) {
errorLogger.capture("skill/route", e);
return Response.json({ error: "Failed to extract skill" }, { status: 500 });
}
}
