import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().describe('要移除验证的范围，如 "A1:A10"'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const removeValidation: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_validation",
	displayName: "移除数据验证",
	module: "validation",
	description: "移除指定范围内的所有数据验证规则。移除后单元格不再有下拉列表或输入限制。",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeValidation: bridgeRemove } = await import("@/lib/spreadjs/bridge/validation");
		const range = resolveAddress(input.range);
		return bridgeRemove(
			workbook,
			input.sheetName ?? range.sheetName,
			range.row, range.col,
			range.rowCount, range.colCount,
		);
	},
};

export default removeValidation;
