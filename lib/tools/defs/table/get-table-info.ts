import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().optional().describe("表格名称。省略则返回当前 sheet 上所有表格信息"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const getTableInfo: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_table_info",
	displayName: "获取表格信息",
	module: "table",
	description:
		"获取表格详细信息（名称、范围、主题、选项、列名）。不传 name 则返回当前 sheet 所有表格。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getTableInfo: bridge } = await import("@/lib/spreadjs/bridge/table");
		return bridge(workbook, input);
	},
};

export default getTableInfo;
