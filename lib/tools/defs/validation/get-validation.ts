import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().describe('要查询的范围，如 "A1:A10"'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const getValidation: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_validation",
	displayName: "获取数据验证",
	module: "validation",
	description:
		"获取指定范围内的数据验证规则信息。返回每个有验证器的单元格的规则类型、有效值列表、提示信息等。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getValidation: bridgeGet } = await import("@/lib/spreadjs/bridge/validation");
		const range = resolveAddress(input.range);
		return bridgeGet(
			workbook,
			input.sheetName ?? range.sheetName,
			range.row, range.col,
			range.rowCount, range.colCount,
		);
	},
};

export default getValidation;
