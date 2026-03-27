import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const scaleValueTypeEnum = z.enum([
	"number", "lowestValue", "highestValue", "percent", "percentile", "formula", "automin", "automax",
]).describe("刻度值类型");

const inputSchema = z.object({
	address: z.string().describe('应用范围，如 "A1:D20"'),
	scaleType: z.enum(["twoColor", "threeColor"]).default("twoColor").describe("色阶类型：双色 / 三色"),
	minType: scaleValueTypeEnum.default("lowestValue"),
	minValue: z.number().default(0).describe("最小值（lowestValue/highestValue 时忽略）"),
	minColor: z.string().default("#F8696B").describe('最小值颜色，CSS 格式如 "#F8696B"'),
	midType: scaleValueTypeEnum.optional().describe("中间值类型（仅三色需要）"),
	midValue: z.number().optional().describe("中间值"),
	midColor: z.string().optional().describe('中间值颜色，CSS 格式如 "#FFEB84"'),
	maxType: scaleValueTypeEnum.default("highestValue"),
	maxValue: z.number().default(0).describe("最大值（lowestValue/highestValue 时忽略）"),
	maxColor: z.string().default("#63BE7B").describe('最大值颜色，CSS 格式如 "#63BE7B"'),
});

const addColorScale: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_color_scale",
	displayName: "色阶",
	module: "conditional_formatting",
	description:
		"为指定范围添加色阶条件格式（渐变色）。支持双色和三色渐变。色阶适合展示数值分布趋势，不适合做阈值高亮 — 阈值高亮请用 add_highlight_rule。示例：双色红绿渐变，minColor='#F8696B', maxColor='#63BE7B'。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.address);
		return bridge.addColorScale(workbook, range, input);
	},
};

export default addColorScale;
