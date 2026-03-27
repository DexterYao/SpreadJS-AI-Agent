import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const fieldSchema = z.object({
	sourceName: z.string().describe("数据源中的字段名（列标题）"),
	displayName: z.string().optional().describe("显示名称，省略则与 sourceName 相同"),
	area: z.enum(["row", "column", "value", "filter"]).describe("放置区域"),
	subtotal: z.enum(["sum", "count", "average", "max", "min", "countNums", "stdDev", "stdDevP", "var", "varP"])
		.optional().default("sum").describe("聚合方式（仅 value 区域有效）"),
});

const inputSchema = z.object({
	pivotTableName: z.string().describe("要修改的透视表名称（通过 get_all_objects 获取）"),
	sheetName: z.string().optional().describe("透视表所在工作表，省略则自动搜索"),
	addFields: z.array(fieldSchema).optional().describe("要添加的字段列表"),
	removeFields: z.array(z.string()).optional().describe("要移除的字段名列表"),
});

const modifyPivotTable: ToolDef<z.infer<typeof inputSchema>> = {
	name: "modify_pivot_table",
	displayName: "修改透视表",
	module: "pivot",
	description:
		"修改已有透视表的字段配置：添加新字段到行/列/值/筛选区域，或移除已有字段。先用 get_all_objects 获取透视表名称。不要用此工具创建透视表 — 请用 add_pivot_table。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.modifyPivotTable(workbook, input);
	},
};

export default modifyPivotTable;
