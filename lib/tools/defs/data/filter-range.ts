import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const conditionSchema = z.object({
	type: z.enum(["greaterThan", "lessThan", "equals", "contains", "between"])
		.describe("条件类型"),
	value: z.union([z.string(), z.number()]).describe("比较值"),
	value2: z.union([z.string(), z.number()]).optional().describe("between 的第二个值"),
});

const filterItemSchema = z.object({
	column: z.number().int().min(0).describe("筛选列索引（0-based）。Table 模式下相对于表格第一列；普通区域模式下相对于 range 起始列"),
	values: z.array(z.string()).optional().describe("保留的值列表（值筛选模式）"),
	condition: conditionSchema.optional().describe("条件筛选模式（与 values 二选一）"),
});

const inputSchema = z.object({
	range: z.string().describe('筛选范围，如 "A1:D100" 或 "Sheet1!A1:D100"。若目标是 Table，填写表格所在区域或任意含义明确的地址即可'),
	isTable: z.boolean().default(false).describe("【必须明确回答】目标是否为 Table 表格对象（而非普通区域）。true 时必须同时提供 tableName"),
	tableName: z.string().optional().describe("Table 名称。isTable=true 时必填。可通过 get_table_info 获取当前工作表的所有表格名称"),
	filters: z.array(filterItemSchema).optional().describe("筛选条件列表"),
	action: z.enum(["apply", "clear"]).default("apply").describe("apply=设置筛选, clear=清除筛选"),
});

const filterRange: ToolDef<z.infer<typeof inputSchema>> = {
	name: "filter_range_or_table",
	displayName: "自动筛选（范围/表格）",
	description:
		'对普通区域或 Table 表格设置自动筛选。【重要前置步骤】调用前必须明确目标类型：若明确filter的目标是 Table（工作表内用 tables.add 创建的结构化表格），必须设 isTable=true 并使用table的工具调用获取 tableName，否则筛选不会作用于表格数据；Table 模式下 column 索引相对于表格第一列（0-based）；普通区域模式下 column 相对于 range 起始列（0-based）。支持值列表筛选（values）和条件筛选（greaterThan/lessThan/equals/contains/between）。action="clear" 清除筛选。',
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.range);
		return bridge.filterRange(workbook, range, input.filters || [], input.action, input.isTable, input.tableName);
	},
};

export default filterRange;
