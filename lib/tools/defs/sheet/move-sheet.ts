import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要移动的工作表名称"),
	targetIndex: z.number().describe("目标位置索引（从 0 开始）"),
});

const moveSheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "move_sheet",
	displayName: "移动工作表",
	description:
		"移动工作表到指定位置，改变工作表标签栏中的顺序。索引从 0 开始，0 表示最左边。不会改变活动工作表。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.moveSheet(workbook, input.name, input.targetIndex);
	},
};

export default moveSheet;
