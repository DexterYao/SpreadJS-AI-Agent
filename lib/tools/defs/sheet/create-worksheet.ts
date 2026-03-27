import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("新工作表名称"),
	index: z
		.number()
		.optional()
		.describe("插入位置索引，不指定则添加到末尾"),
});

const createWorksheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "create_worksheet",
	displayName: "创建工作表",
	description:
		"创建新工作表并插入到指定位置。创建后不会自动切换活动工作表，用户仍停留在当前工作表。名称不能与已有工作表重复。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.createWorksheet(workbook, input.name, input.index);
	},
};

export default createWorksheet;
