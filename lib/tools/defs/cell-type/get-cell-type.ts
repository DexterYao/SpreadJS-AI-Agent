import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().describe('要查询的范围，如 "A1:A10"'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const getCellType: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_cell_type",
	displayName: "获取单元格类型",
	module: "cell_type",
	description:
		"获取指定范围内的单元格类型信息。返回每个有自定义类型（非默认文本）的单元格的类型名称和属性。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getCellType: bridgeGet } = await import("@/lib/spreadjs/bridge/cell-type");
		const range = resolveAddress(input.range);
		return bridgeGet(
			workbook,
			input.sheetName ?? range.sheetName,
			range.row, range.col,
			range.rowCount, range.colCount,
		);
	},
};

export default getCellType;
