import { generateText } from "ai";
import { buildLLM } from "@/lib/llm/provider";
import { LLM_CONFIG } from "@/lib/config";
import { errorLogger } from "@/lib/logging";

const apiKey = process.env.TITLE_API_KEY || process.env[LLM_CONFIG.apiKeyEnv];
const baseURL = process.env.TITLE_BASE_URL || LLM_CONFIG.baseURL;
const modelId = process.env.TITLE_MODEL || LLM_CONFIG.model;

const titleLlm = modelId
	? buildLLM({ model: modelId, apiKey, baseURL })
	: null;

export async function POST(req: Request) {
	const { firstMessage }: { firstMessage: string } = await req.json();
	if (!firstMessage?.trim() || !titleLlm) {
		return Response.json({ title: "新会话" });
	}

	try {
		const { text } = await generateText({
			model: titleLlm,
			system: `你是一位擅长为聊天机器人对话编写简洁标题的专家。
你会收到一个聊天请求，需要回复一个简短的标题，该标题应该准确捕捉该请求的主要话题。
标题不应该被引号包裹。长度应该在 25 个字以内。
以下是一些好的标题示例：
- 在表格中添加条件格式
- 合并多个工作表中的数据
- 创建数据透视表汇总销售数据
- 公式中的 VLOOKUP 用法
- 为财务报表添加图表`,
			prompt: `请为以下请求编写一个简短的标题。请用中文回复，不要加引号。\n\n${firstMessage.slice(0, 500)}`,
			maxOutputTokens: 80,
		});

		let title = text.trim();
		// 去掉 LLM 可能加的外层引号
		if (title.match(/^["「『].*["」』]$/)) {
			title = title.slice(1, -1).trim();
		}

		return Response.json({ title: title || "新会话" });
	} catch (e) {
		errorLogger.capture("title/route", e);
		return Response.json({ title: "新会话" });
	}
}
