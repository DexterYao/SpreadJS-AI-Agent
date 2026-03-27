import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	cellAddress: z.string().describe('单元格地址，如 "A1" 或 "Sheet1!B3"'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const removeHyperlink: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_hyperlink",
	displayName: "移除超链接",
	module: "hyperlink",
	description: "移除指定单元格的超链接（保留单元格内容，仅去除链接）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeHyperlink: bridgeRemove } = await import("@/lib/spreadjs/bridge/hyperlink");
		const addr = resolveAddress(input.cellAddress);
		return bridgeRemove(workbook, input.sheetName ?? addr.sheetName, addr.row, addr.col);
	},
};

export default removeHyperlink;
