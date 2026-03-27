import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	address: z.string().describe('合并范围，如 "A1:C3" 或 "Sheet1!B2:D5"'),
	action: z.enum(["merge", "unmerge"]).describe("merge=合并, unmerge=取消合并"),
});

const mergeCells: ToolDef<z.infer<typeof inputSchema>> = {
	name: "merge_cells",
	displayName: "合并单元格",
	module: "format",
	description:
		"合并或取消合并单元格区域。合并后只保留左上角单元格的内容，其他单元格内容被隐藏。取消合并时 range 指向合并区域的左上角即可。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.address);
		return bridge.mergeCells(workbook, range, input.action);
	},
};

export default mergeCells;
