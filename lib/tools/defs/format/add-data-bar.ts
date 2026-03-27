import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const scaleValueTypeEnum = z.enum([
	"number", "lowestValue", "highestValue", "percent", "percentile", "formula", "automin", "automax",
]).describe("刻度值类型");

const inputSchema = z.object({
	address: z.string().describe('应用范围，如 "A1:A20"'),
	color: z.string().default("#638EC6").describe('数据条颜色，CSS 格式如 "#638EC6" 或 "orange"'),
	minType: scaleValueTypeEnum.default("automin"),
	minValue: z.number().default(0).describe("最小刻度值"),
	maxType: scaleValueTypeEnum.default("automax"),
	maxValue: z.number().default(0).describe("最大刻度值"),
});

const addDataBar: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_data_bar",
	displayName: "数据条",
	module: "conditional_formatting",
	description:
		"为指定范围添加数据条条件格式。数据条在每个单元格内绘制一条横向长条，长度与数值成正比，适合快速比较同列数值大小。不适合做阈值判断 — 请用 add_highlight_rule。不适合展示渐变色 — 请用 add_color_scale。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.address);
		return bridge.addDataBar(workbook, range, input);
	},
};

export default addDataBar;
