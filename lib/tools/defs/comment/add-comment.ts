import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	cell: z.string().describe('单元格地址，如 "A1" 或 "Sheet1!B3"'),
	text: z.string().describe("批注文本内容"),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const addComment: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_comment",
	displayName: "添加批注",
	module: "comment",
	description:
		"为指定单元格添加批注。若该单元格已有批注则覆盖。" +
		"\n示例：cell='A1', text='请核实此数据'",
	inputSchema,
	handler: async (workbook, input) => {
		const { addComment: bridgeAdd } = await import("@/lib/spreadjs/bridge/comment");
		const addr = resolveAddress(input.cell);
		return bridgeAdd(workbook, input.sheetName ?? addr.sheetName, {
			row: addr.row,
			col: addr.col,
			text: input.text,
		});
	},
};

export default addComment;
