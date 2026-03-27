import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const sortKeySchema = z.object({
	column: z.string().describe('排序依据的列字母，如 "A"、"C"'),
	ascending: z.boolean().default(true).describe("true 升序，false 降序"),
});

const inputSchema = z.object({
	address: z.string().describe('排序范围，如 "A1:D20" 或 "Sheet1!A1:D20"'),
	sortKeys: z.array(sortKeySchema).min(1).describe("排序键列表，支持多列排序，优先级按数组顺序"),
});

const sortRange: ToolDef<z.infer<typeof inputSchema>> = {
	name: "sort_range",
	displayName: "排序",
	description:
		'对指定范围按列排序。支持多列排序，按 sortKeys 数组顺序确定优先级。仅做值排序，不支持按颜色排序。示例：sortKeys: [{column:"B", ascending:false}] 表示按 B 列降序。',
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.address);
		return bridge.sortRange(workbook, range, input.sortKeys);
	},
};

export default sortRange;
