import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	ranges: z
		.array(
			z.object({
				address: z
					.string()
					.describe('范围地址，如 "A1:B5" 或 "Sheet1!A1:C10"'),
			}),
		)
		.describe("要读取的范围列表"),
});

const readRanges: ToolDef<z.infer<typeof inputSchema>> = {
	name: "read_ranges",
	displayName: "读取数据",
	description:
		"按范围地址批量读取单元格数据，返回每个单元格的值、公式和格式化文本。空单元格 value 为 null。支持多个范围同时读取。超过 50 行时自动裁剪为前 20 行 + 统计摘要。按内容搜索定位请用 search_data。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const ranges = input.ranges.map((r) => resolveAddress(r.address));
		return bridge.readRanges(workbook, ranges);
	},
};

export default readRanges;
