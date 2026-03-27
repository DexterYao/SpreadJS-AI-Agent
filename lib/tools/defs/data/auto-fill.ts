import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	sourceRange: z.string().describe('源范围（已有数据），如 "A1:A3"'),
	destRange: z.string().describe('目标范围（包含源范围），如 "A1:A10"'),
	sheetName: z.string().optional().describe("工作表名称，省略则为活动工作表"),
});

const autoFill: ToolDef<z.infer<typeof inputSchema>> = {
	name: "auto_fill",
	displayName: "自动填充",
	description:
		"拖拽填充（序列扩展）。从 sourceRange 的数据模式（等差、等比、日期序列等）自动推断并填充到 destRange。destRange 必须包含 sourceRange。典型用法：A1=1, A2=2 → 填充到 A1:A10 得到 1~10 的等差序列。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const source = resolveAddress(input.sheetName ? `${input.sheetName}!${input.sourceRange}` : input.sourceRange);
		const dest = resolveAddress(input.sheetName ? `${input.sheetName}!${input.destRange}` : input.destRange);
		return bridge.autoFill(workbook, source, dest);
	},
};

export default autoFill;
