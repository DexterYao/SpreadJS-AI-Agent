import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	cell: z.string().describe('单元格地址，如 "A1" 或 "Sheet1!B3"'),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const removeComment: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_comment",
	displayName: "删除批注",
	module: "comment",
	description:
		"删除指定单元格的批注。单元格必须已有批注，否则报错。" +
		"\n示例：cell='A1'",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeComment: bridgeRemove } = await import("@/lib/spreadjs/bridge/comment");
		const addr = resolveAddress(input.cell);
		return bridgeRemove(workbook, input.sheetName ?? addr.sheetName, {
			row: addr.row,
			col: addr.col,
		});
	},
};

export default removeComment;
