import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().describe('要清除状态样式的范围，如 "A1:B5"'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const removeCellState: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_cell_state",
	displayName: "移除单元格状态",
	module: "cell_state",
	description:
		"清除指定范围上的所有单元格状态样式。清除后该范围不再响应任何状态变化。" +
		"\n注意：此操作会移除该范围上全部状态类型（hover/active/dirty 等）的样式，无法单独移除某一类型。",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeCellState: bridgeRemove } = await import("@/lib/spreadjs/bridge/cell-state");
		const range = resolveAddress(input.range);
		return bridgeRemove(
			workbook,
			input.sheetName ?? range.sheetName,
			range.row, range.col,
			range.rowCount, range.colCount,
		);
	},
};

export default removeCellState;
