import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要复制的源工作表名称"),
	newName: z.string().describe("复制后的新工作表名称，不能与已有工作表重复"),
	targetIndex: z
		.number()
		.optional()
		.describe("新工作表插入位置索引，不指定则添加到末尾"),
});

const copySheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "copy_sheet",
	displayName: "复制工作表",
	description:
		"复制工作表（含数据、格式、图表、表格等全部内容）到新工作表。公式中的当前工作表引用会自动更新为新工作表名称，跨表引用保持不变。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.copySheet(workbook, input.name, input.newName, input.targetIndex);
	},
};

export default copySheet;
