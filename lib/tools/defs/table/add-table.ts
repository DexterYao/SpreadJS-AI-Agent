import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("表格名称，如 Table1"),
	range: z.string().describe('范围地址，A1 格式，如 "A1:C10"'),
	theme: z.string().optional().describe("主题名，如 medium2、dark1、light1。省略则为 medium2"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
	hasHeaders: z.boolean().optional().default(true).describe("首行是否为表头，默认 true"),
});

const addTable: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_table",
	displayName: "创建表格",
	module: "table",
	description:
		"在指定范围创建 Excel 表格。范围须包含数据（至少首行为表头）。支持 light1-21、medium1-28、dark1-11 内置主题。创建后表格自动带筛选按钮。",
	inputSchema,
	handler: async (workbook, input) => {
		const { addTable: bridge } = await import("@/lib/spreadjs/bridge/table");
		return bridge(workbook, input);
	},
};

export default addTable;
