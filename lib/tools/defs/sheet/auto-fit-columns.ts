import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	columns: z.array(z.number().int().min(0)).describe("要自适应的列索引列表（0-based）"),
	sheetName: z.string().optional().describe("工作表名称，省略则为活动工作表"),
	autoFitRows: z.boolean().optional().default(false).describe("同时自适应行高"),
});

const autoFitColumns: ToolDef<z.infer<typeof inputSchema>> = {
	name: "auto_fit_columns",
	displayName: "自适应列宽",
	description:
		"根据单元格内容自动调整列宽。传入 0-based 列索引数组。可选同时自适应行高。适用于数据写入后让内容完整显示。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.autoFitColumns(workbook, input.sheetName, input.columns, input.autoFitRows);
	},
};

export default autoFitColumns;
