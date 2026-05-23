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

function extractToolCalls(messages: unknown): ToolCall[] {
if (!Array.isArray(messages)) return [];
const calls: ToolCall[] = [];

for (const msg of messages) {
if (!msg || typeof msg !== "object") continue;
const role = (msg as { role?: unknown }).role;
if (role !== "assistant") continue;
const parts = (msg as { parts?: unknown }).parts;
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
calls.push({ toolName, input: p.input });
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
return `${idx + 1}. toolName=${call.toolName}${inputSummary ? `, inputSummary=${inputSummary}` : ""}`;
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
- name 和 description 要可读、可复用`,
prompt: `以下是一次对话中按时间顺序成功执行的工具调用：\n${toolLines}\n\n请生成一个 Skill。`,
maxOutputTokens: 1200,
});

return Response.json(object);
} catch (e) {
errorLogger.capture("skill/route", e);
return Response.json({ error: "Failed to extract skill" }, { status: 500 });
}
}
