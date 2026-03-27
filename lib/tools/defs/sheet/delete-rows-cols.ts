import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("工作表名称，省略则操作活动工作表"),
	direction: z.enum(["row", "column"]).describe("删除方向：row 删除行，column 删除列"),
	index: z.number().int().min(0).describe("起始位置索引（0 起始）"),
	count: z.number().int().min(1).default(1).describe("删除数量"),
});

const deleteRowsCols: ToolDef<z.infer<typeof inputSchema>> = {
	name: "delete_rows_cols",
	displayName: "删除行列",
	description:
		"删除指定位置的行或列，数据不可恢复。index 为 0 起始的位置索引。例如 index=0, count=3, direction=row 表示删除前 3 行。删除后后续行列自动前移。如果只是清除内容而非删除整行/列，请用 clear_cells。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.deleteRowsCols(workbook, input.sheetName, input.direction, input.index, input.count);
	},
};

export default deleteRowsCols;
