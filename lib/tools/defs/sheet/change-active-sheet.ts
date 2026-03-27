import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要切换到的工作表名称"),
});

const changeActiveSheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "change_active_sheet",
	displayName: "切换活动工作表",
	description:
		"切换当前活动工作表。后续所有不指定 sheetName 的操作都将作用于新的活动工作表。当需要在多个工作表之间操作时，先用此工具切换目标工作表。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.changeActiveSheet(workbook, input.name);
	},
};

export default changeActiveSheet;
