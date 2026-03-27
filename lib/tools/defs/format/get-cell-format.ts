import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { parseRangeAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	cell: z.string().describe('单元格地址，如 "A1" 或 "Sheet1!B3"'),
});

const getCellFormat: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_cell_format",
	displayName: "获取单元格格式",
	module: "format",
	description:
		"获取单个单元格的详细格式信息：值、公式、格式化文本、字体、颜色、对齐、边框、数字格式、合并状态。用于在修改格式前了解当前状态。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const parsed = parseRangeAddress(input.cell);
		return bridge.getCellFormat(workbook, parsed.sheetName, parsed.startRow, parsed.startCol);
	},
};

export default getCellFormat;
