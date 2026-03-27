import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("工作表名称，省略则为活动工作表"),
	rows: z.array(z.object({
		index: z.number().int().min(0).describe("行索引（0-based）"),
		height: z.number().min(0).describe("行高（像素）"),
	})).optional().describe("要设置高度的行列表"),
	columns: z.array(z.object({
		index: z.number().int().min(0).describe("列索引（0-based）"),
		width: z.number().min(0).describe("列宽（像素）"),
	})).optional().describe("要设置宽度的列列表"),
});

const resizeRange: ToolDef<z.infer<typeof inputSchema>> = {
	name: "resize_range",
	displayName: "设置行高列宽",
	description:
		"设置指定行的高度和/或指定列的宽度（像素）。支持批量设置多行多列。索引为 0-based。至少提供 rows 或 columns 之一。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.resizeRange(workbook, input.sheetName, {
			rows: input.rows,
			columns: input.columns,
		});
	},
};

export default resizeRange;
