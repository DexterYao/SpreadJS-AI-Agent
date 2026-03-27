import { z } from "zod/v4";
import type { FormatSpec } from "@/lib/agent/types";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	address: z.string().describe('范围地址，如 "A1:D10"，支持逗号分隔的多区域如 "A1:A8,B1:B8"'),
	fontFamily: z.string().optional().describe("字体名称，如 'Arial'"),
	fontSize: z.number().optional().describe("字号（pt）"),
	bold: z.boolean().optional().describe("是否加粗"),
	italic: z.boolean().optional().describe("是否斜体"),
	foreColor: z.string().optional().describe('字体颜色，CSS 格式如 "#FFFFFF" 或 "red"'),
	backColor: z.string().optional().describe('背景颜色，CSS 格式如 "#4472C4" 或 "yellow"'),
	hAlign: z
		.enum(["left", "center", "right"])
		.optional()
		.describe("水平对齐"),
	vAlign: z
		.enum(["top", "center", "bottom"])
		.optional()
		.describe("垂直对齐"),
	formatter: z
		.string()
		.optional()
		.describe('数字格式，如 "#,##0.00" 或 "yyyy-MM-dd"'),
	wordWrap: z.boolean().optional().describe("是否自动换行"),
	underline: z.boolean().optional().describe("是否下划线"),
	strikethrough: z.boolean().optional().describe("是否删除线"),
});

const formatRange: ToolDef<z.infer<typeof inputSchema>> = {
	name: "format_range",
	displayName: "设置格式",
	module: "format",
	description:
		"仅设置格式，不修改单元格数据。每个格式参数均可选，只传需要改的属性。颜色使用 CSS 格式如 '#FF0000' 或 'red'。数字格式示例：'#,##0.00'（千分位两位小数）、'yyyy-MM-dd'（日期）、'0%'（百分比）。支持逗号分隔的多区域地址。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const { address, ...rest } = input;
		const format: FormatSpec = {};
		if (rest.fontFamily != null) format.fontFamily = rest.fontFamily;
		if (rest.fontSize != null) format.fontSize = rest.fontSize;
		if (rest.bold != null) format.bold = rest.bold;
		if (rest.italic != null) format.italic = rest.italic;
		if (rest.foreColor != null) format.foreColor = rest.foreColor;
		if (rest.backColor != null) format.backColor = rest.backColor;
		if (rest.hAlign != null) format.hAlign = rest.hAlign;
		if (rest.vAlign != null) format.vAlign = rest.vAlign;
		if (rest.formatter != null) format.formatter = rest.formatter;
		if (rest.wordWrap != null) format.wordWrap = rest.wordWrap;
		if (rest.underline != null) format.underline = rest.underline;
		if (rest.strikethrough != null) format.strikethrough = rest.strikethrough;
		return bridge.formatRange(workbook, address, format);
	},
};

export default formatRange;
