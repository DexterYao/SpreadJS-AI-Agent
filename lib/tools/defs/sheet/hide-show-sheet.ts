import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("工作表名称"),
	visibility: z
		.enum(["visible", "hidden", "veryHidden"])
		.describe("可见性：visible=显示、hidden=隐藏（可通过右键菜单取消隐藏）、veryHidden=深度隐藏（只能通过 API 取消隐藏）"),
});

const hideShowSheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "hide_show_sheet",
	displayName: "显示/隐藏工作表",
	description:
		"设置工作表可见性。hidden 隐藏后用户可通过右键菜单取消隐藏；veryHidden 深度隐藏后用户无法通过 UI 取消隐藏，只能通过此工具恢复为 visible。不能隐藏唯一可见的工作表。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.hideShowSheet(workbook, input.name, input.visibility);
	},
};

export default hideShowSheet;
