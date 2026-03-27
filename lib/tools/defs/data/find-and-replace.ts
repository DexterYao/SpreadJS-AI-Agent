import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	find: z.string().describe("查找文本"),
	replace: z.string().optional().describe("替换文本（不提供则仅查找）"),
	sheetName: z.string().optional().describe("限定工作表（不提供则搜索所有工作表）"),
	matchCase: z.boolean().optional().default(false).describe("区分大小写"),
	matchEntireCell: z.boolean().optional().default(false).describe("完整匹配单元格内容"),
	useRegex: z.boolean().optional().default(false).describe("使用通配符匹配"),
});

const findAndReplace: ToolDef<z.infer<typeof inputSchema>> = {
	name: "find_and_replace",
	displayName: "查找替换",
	description:
		"在工作簿中查找文本，可选替换。仅查找时返回匹配位置列表（最多 50 条）。提供 replace 参数时执行替换并返回替换数量。支持大小写匹配和通配符。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.findAndReplace(workbook, input);
	},
};

export default findAndReplace;
