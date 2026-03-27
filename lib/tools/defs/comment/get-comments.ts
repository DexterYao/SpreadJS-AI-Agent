import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().optional()
		.describe('扫描范围，如 "A1:D10"。不传则扫描整个已用区域返回所有批注'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const getComments: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_comments",
	displayName: "获取批注",
	module: "comment",
	description:
		"获取工作表上的批注列表。可指定范围只返回该范围内的批注，不传 range 则返回全部。" +
		"\n示例：range='A1:Z100' 获取该区域内所有批注",
	inputSchema,
	handler: async (workbook, input) => {
		const { getComments: bridgeGet } = await import("@/lib/spreadjs/bridge/comment");
		let rangeObj: { row: number; col: number; rowCount: number; colCount: number } | undefined;
		if (input.range) {
			const addr = resolveAddress(input.range);
			rangeObj = { row: addr.row, col: addr.col, rowCount: addr.rowCount, colCount: addr.colCount };
		}
		return bridgeGet(workbook, input.sheetName, rangeObj);
	},
};

export default getComments;
