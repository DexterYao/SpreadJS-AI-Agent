import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要删除的表格名称"),
	keepData: z.boolean().optional().default(true).describe("是否保留单元格数据，默认 true"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const removeTable: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_table",
	displayName: "删除表格",
	module: "table",
	description:
		"删除指定表格。默认保留单元格数据（仅移除表格格式和筛选功能），设 keepData=false 会同时清除数据。",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeTable: bridge } = await import("@/lib/spreadjs/bridge/table");
		return bridge(workbook, input);
	},
};

export default removeTable;
