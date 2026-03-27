import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("表格名称"),
	showHeader: z.boolean().optional().describe("是否显示表头行"),
	showFooter: z.boolean().optional().describe("是否显示汇总行（页脚）"),
	showFilter: z.boolean().optional().describe("是否显示筛选按钮"),
	bandRows: z.boolean().optional().describe("是否显示交替行样式"),
	bandColumns: z.boolean().optional().describe("是否显示交替列样式"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const setTableOption: ToolDef<z.infer<typeof inputSchema>> = {
	name: "set_table_option",
	displayName: "设置表格选项",
	module: "table",
	description:
		"设置表格显示选项：表头行、汇总行、筛选按钮、交替行/列样式。只传需要修改的选项，未传的选项保持不变。",
	inputSchema,
	handler: async (workbook, input) => {
		const { setTableOption: bridge } = await import("@/lib/spreadjs/bridge/table");
		return bridge(workbook, input);
	},
};

export default setTableOption;
