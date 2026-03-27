import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要删除的工作表名称"),
});

const deleteWorksheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "delete_worksheet",
	displayName: "删除工作表",
	description:
		"删除指定工作表及其全部数据，不可恢复。无法删除唯一的工作表。删除后活动工作表会自动切换到相邻工作表。如果只是清空内容请用 clear_cells。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.deleteWorksheet(workbook, input.name);
	},
};

export default deleteWorksheet;
