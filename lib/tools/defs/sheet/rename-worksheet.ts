import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	oldName: z.string().describe("当前工作表名称"),
	newName: z.string().describe("新名称"),
});

const renameWorksheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "rename_worksheet",
	displayName: "重命名工作表",
	description:
		"重命名工作表。新名称不能与已有工作表重复。已有公式中对该工作表的引用会自动更新。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.renameWorksheet(workbook, input.oldName, input.newName);
	},
};

export default renameWorksheet;
