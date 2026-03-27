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
	sourceRange: z.string().describe('数据源：表名（如 "Table1"）或绝对范围公式（如 "=Sheet1!$A$1:$D$100"）'),
	pivotTableName: z.string().optional().describe("透视表名称，省略则自动生成"),
	targetSheetName: z.string().optional().describe("透视表放置的工作表名称，省略则新建工作表"),
	row: z.number().int().min(0).default(0).describe("透视表起始行索引"),
	col: z.number().int().min(0).default(0).describe("透视表起始列索引"),
	layout: z.enum(["compact", "outline", "tabular"]).default("compact").describe("布局类型"),
	fields: z.array(fieldSchema).min(1).describe("字段配置列表，至少一个字段"),
});

const addPivotTable: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_pivot_table",
	displayName: "创建透视表",
	module: "pivot",
	description:
		'在指定位置创建数据透视表。sourceRange 可以是表名或绝对范围公式（如 "=Sheet1!$A$1:$D$100"，注意 $ 符号）。fields 数组配置字段到行/列/值/筛选区域的映射。至少指定一个 value 区域字段才有聚合数据。不要用此工具修改已有透视表。',
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.addPivotTable(workbook, input);
	},
};

export default addPivotTable;
