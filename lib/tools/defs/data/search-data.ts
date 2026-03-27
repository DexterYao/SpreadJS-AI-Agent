import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	keyword: z.string().describe("搜索关键词"),
	sheetName: z
		.string()
		.optional()
		.describe("指定工作表名称，不指定则搜索所有工作表"),
	regex: z.boolean().optional().describe("是否使用正则表达式"),
	matchCase: z.boolean().optional().describe("是否区分大小写"),
});

const searchData: ToolDef<z.infer<typeof inputSchema>> = {
	name: "search_data",
	displayName: "搜索数据",
	description:
		"按关键词搜索单元格内容，返回匹配的位置和值。适合不知道数据位置时按内容定位。超过 20 条结果时自动裁剪并返回 totalMatches。按已知范围批量读取请用 read_ranges。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.searchData(workbook, input.keyword, {
			sheetName: input.sheetName,
			regex: input.regex,
			matchCase: input.matchCase,
		});
	},
};

export default searchData;
