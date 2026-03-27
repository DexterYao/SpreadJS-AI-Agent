import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

/* ── 样式子 schema ── */
const styleSchema = z.object({
	backColor: z.string().optional().describe('背景色，如 "#FF0000" 或 "red"'),
	foreColor: z.string().optional().describe('字体颜色，如 "#FFFFFF"'),
	bold: z.boolean().optional().describe("加粗"),
	italic: z.boolean().optional().describe("斜体"),
});

/**
 * 扁平规则 schema — 避免 discriminatedUnion 产生的 oneOf JSON Schema，
 * 因为 GLM-4.7 等模型在复杂 oneOf 结构下偶尔无法生成完整的闭合 JSON。
 *
 * ruleType 决定哪些字段有效（bridge 层做校验）：
 * - cellValue → operator, value1, value2?
 * - top10    → type(top/bottom), rank
 * - average  → type(above/below/equalOrAbove/...)
 * - duplicate / unique → 无额外字段
 * - specificText → operator, text
 * - dateOccurring → type(today/yesterday/...)
 * - formula  → formula
 */
const ruleSchema = z.object({
	ruleType: z.enum([
		"cellValue", "top10", "average",
		"duplicate", "unique",
		"specificText", "dateOccurring", "formula",
	]).describe("规则类型"),
	operator: z.string().optional()
		.describe("运算符。cellValue: equalsTo/notEqualsTo/greaterThan/greaterThanOrEqualsTo/lessThan/lessThanOrEqualsTo/between/notBetween；specificText: contains/doesNotContain/beginsWith/endsWith"),
	value1: z.number().optional().describe("比较值1（cellValue 用）"),
	value2: z.number().optional().describe("比较值2（cellValue 的 between/notBetween 用）"),
	type: z.string().optional()
		.describe("子类型。top10: top/bottom；average: above/below/equalOrAbove/equalOrBelow/above1StdDev/below1StdDev/above2StdDev/below2StdDev/above3StdDev/below3StdDev；dateOccurring: today/yesterday/tomorrow/last7Days/thisMonth/lastMonth/nextMonth/thisWeek/lastWeek/nextWeek/thisQuarter/lastQuarter/nextQuarter/thisYear/lastYear/nextYear"),
	rank: z.number().optional().describe("top10 的 N 值（1-1000）"),
	text: z.string().optional().describe("specificText 要匹配的文本"),
	formula: z.string().optional().describe('formula 规则的公式，如 "=A1>100"'),
});

const inputSchema = z.object({
	address: z.string().describe('应用范围，如 "A1:D20" 或 "Sheet1!A1:D20"'),
	rule: ruleSchema.describe("规则详情，由 ruleType 决定哪些字段有效"),
	style: styleSchema.describe("满足条件时应用的样式"),
});

const addHighlightRule: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_highlight_rule",
	displayName: "高亮规则",
	module: "conditional_formatting",
	description:
		"添加单元格高亮条件格式。支持 8 种子类型：cellValue（值比较）、top10（前/后 N 项）、average（高于/低于平均值）、duplicate（重复值）、unique（唯一值）、specificText（包含/不包含文本）、dateOccurring（日期出现）、formula（自定义公式）。每种子类型参数不同，通过 ruleType 区分。这是纯高亮工具，不适用于色阶/数据条/图标集 — 请分别使用 add_color_scale / add_data_bar / add_icon_set。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.addHighlightRule(workbook, input.address, input.rule, input.style);
	},
};

export default addHighlightRule;
