import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().optional()
		.describe('扫描范围，如 "A1:Z100"。不传则扫描当前 sheet 全部已使用区域'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const getHyperlinks: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_hyperlinks",
	displayName: "获取超链接列表",
	module: "hyperlink",
	description: "获取指定范围（或整个 sheet）内所有超链接。返回每个超链接的位置、URL、提示文本。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getHyperlinks: bridgeGet } = await import("@/lib/spreadjs/bridge/hyperlink");
		if (input.range) {
			const addr = resolveAddress(input.range);
			return bridgeGet(
				workbook,
				input.sheetName ?? addr.sheetName,
				addr.row, addr.col, addr.rowCount, addr.colCount,
			);
		}
		return bridgeGet(workbook, input.sheetName);
	},
};

export default getHyperlinks;
