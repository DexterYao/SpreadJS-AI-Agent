import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().describe('要移除类型的范围，如 "A1:A10"'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const removeCellType: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_cell_type",
	displayName: "移除单元格类型",
	module: "cell_type",
	description: "移除指定范围的单元格类型，恢复为默认文本单元格。移除后 checkbox/button/combobox 等控件消失。",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeCellType: bridgeRemove } = await import("@/lib/spreadjs/bridge/cell-type");
		const range = resolveAddress(input.range);
		return bridgeRemove(
			workbook,
			input.sheetName ?? range.sheetName,
			range.row, range.col,
			range.rowCount, range.colCount,
		);
	},
};

export default removeCellType;
