import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("表格名称"),
	theme: z.string().describe("主题名，如 dark1、medium2、light1"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const setTableStyle: ToolDef<z.infer<typeof inputSchema>> = {
	name: "set_table_style",
	displayName: "设置表格样式",
	module: "table",
	description:
		"修改已有表格的主题样式。原地替换主题，不丢失数据。支持 light1-21、medium1-28、dark1-11 内置主题。禁止用 remove+add 方式换主题。",
	inputSchema,
	handler: async (workbook, input) => {
		const { setTableStyle: bridge } = await import("@/lib/spreadjs/bridge/table");
		return bridge(workbook, input);
	},
};

export default setTableStyle;
