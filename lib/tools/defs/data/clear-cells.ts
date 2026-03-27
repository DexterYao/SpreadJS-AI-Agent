import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	address: z.string().describe('范围地址，如 "A1:C10"'),
	clearType: z.enum(["content", "format", "all"]).describe("清除类型"),
});

const clearCells: ToolDef<z.infer<typeof inputSchema>> = {
	name: "clear_cells",
	displayName: "清除单元格",
	description:
		"仅清除指定范围，不写入新内容。content=只清数据保留格式，format=只清格式保留数据，all=全清。若要写入新值请用 write_data。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.address);
		return bridge.clearCells(workbook, range, input.clearType);
	},
};

export default clearCells;
