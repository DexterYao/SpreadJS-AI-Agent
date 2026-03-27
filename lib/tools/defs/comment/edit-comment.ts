import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	cell: z.string().describe('单元格地址，如 "A1" 或 "Sheet1!B3"'),
	text: z.string().describe("新的批注文本内容"),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const editComment: ToolDef<z.infer<typeof inputSchema>> = {
	name: "edit_comment",
	displayName: "编辑批注",
	module: "comment",
	description:
		"编辑指定单元格的已有批注内容。单元格必须已有批注，否则报错。" +
		"\n示例：cell='A1', text='已更新的批注内容'",
	inputSchema,
	handler: async (workbook, input) => {
		const { editComment: bridgeEdit } = await import("@/lib/spreadjs/bridge/comment");
		const addr = resolveAddress(input.cell);
		return bridgeEdit(workbook, input.sheetName ?? addr.sheetName, {
			row: addr.row,
			col: addr.col,
			text: input.text,
		});
	},
};

export default editComment;
