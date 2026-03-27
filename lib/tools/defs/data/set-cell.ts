import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { parseRangeAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	cell: z.string().describe('单元格地址，如 "A1" 或 "Sheet2!B3"'),
	value: z.union([z.string(), z.number(), z.boolean(), z.null()])
		.describe('写入值。公式以"="开头，如 "=SUM(A1:A5)"'),
	type: z.enum(["string", "number", "boolean", "null"]).describe("值类型，公式需要指定为 string"),
});

const setCell: ToolDef<z.infer<typeof inputSchema>> = {
	name: "set_cell",
	displayName: "写入单元格",
	description:
		'写入单个单元格。比 write_data 更轻量 — 只需 cell 地址和 value，无需构造二维数组。公式以"="开头。适用于设置单个值、修正公式、写入标题等场景。批量写入请用 write_data。',
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const parsed = parseRangeAddress(input.cell);
		return bridge.setCell(
			workbook, parsed.sheetName,
			parsed.startRow, parsed.startCol,
			input.value,
			input.type,
		);
	},
};

export default setCell;
