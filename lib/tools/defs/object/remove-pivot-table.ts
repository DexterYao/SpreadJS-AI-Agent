import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	pivotTableName: z.string().describe("要删除的透视表名称（通过 get_all_objects 获取）"),
	sheetName: z.string().optional().describe("透视表所在工作表，省略则自动搜索"),
});

const removePivotTable: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_pivot_table",
	displayName: "删除透视表",
	module: "pivot",
	description:
		"从工作簿中删除指定透视表。先用 get_all_objects 获取透视表名称。省略 sheetName 时会自动搜索所有工作表。删除操作不可逆。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.removePivotTable(workbook, input.pivotTableName, input.sheetName);
	},
};

export default removePivotTable;
