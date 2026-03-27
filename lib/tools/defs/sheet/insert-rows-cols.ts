import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("工作表名称，省略则操作活动工作表"),
	direction: z.enum(["row", "column"]).describe("插入方向：row 插入行，column 插入列"),
	index: z.number().int().min(0).describe("插入位置索引（0 起始），新行/列在此索引之前插入"),
	count: z.number().int().min(1).default(1).describe("插入数量"),
});

const insertRowsCols: ToolDef<z.infer<typeof inputSchema>> = {
	name: "insert_rows_cols",
	displayName: "插入行列",
	description:
		"在指定位置插入空白行或列。index 为 0 起始的位置索引，新内容在该位置之前插入。例如 index=2, direction=row 表示在第 3 行前插入。新插入的行列为空，不要用此工具移动数据。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.insertRowsCols(workbook, input.sheetName, input.direction, input.index, input.count);
	},
};

export default insertRowsCols;
