import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import type { AskUserInput, AskUserOutputData } from "@/lib/agent/ui-message";

const inputSchema = z.object({
	question: z.string().describe("向用户提出的问题"),
	options: z.array(z.string()).min(2).max(6).describe("供用户选择的选项列表，2-6 个"),
});

const askUser: ToolDef<AskUserInput, AskUserOutputData> = {
	name: "ask_user",
	displayName: "询问用户",
	description:
		"向用户提出选择题，暂停 Agent 循环等待用户回答。适用于：不确定用户意图时、需要在多种方案中选择时、操作可能有风险需确认时。不要用于简单的是/否确认。",
	inputSchema,
	handler: async (_workbook, input) => {
		// handler 只返回问题和选项，实际的用户交互由 UI 渲染层处理
		return {
			success: true,
			data: {
				question: input.question,
				options: input.options,
				awaitingSelection: true,
			},
		};
	},
};

export default askUser;
