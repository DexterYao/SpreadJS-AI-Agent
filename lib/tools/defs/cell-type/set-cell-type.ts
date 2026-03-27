import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	range: z.string().describe('目标范围，如 "A1" 或 "A1:A10"'),
	type: z.enum(["checkbox", "combobox", "button", "hyperlink"])
		.describe("单元格类型：checkbox=复选框, combobox=下拉选择框, button=按钮, hyperlink=超链接"),
	// checkbox
	caption: z.string().optional().describe("checkbox 的标题文本"),
	isThreeState: z.boolean().optional().describe("checkbox 是否支持三态（true/false/indeterminate），默认 false"),
	textTrue: z.string().optional().describe("checkbox 勾选时显示的文本"),
	textFalse: z.string().optional().describe("checkbox 未勾选时显示的文本"),
	// combobox
	items: z.array(z.string()).optional().describe('combobox 的下拉选项列表，如 ["选项A","选项B","选项C"]'),
	editable: z.boolean().optional().describe("combobox 是否允许手动输入（不限于下拉列表），默认 false"),
	// button
	text: z.string().optional().describe("button 上显示的文本"),
	buttonBackColor: z.string().optional().describe('button 背景色，如 "#4472C4"'),
	// hyperlink
	linkColor: z.string().optional().describe('hyperlink 链接颜色，如 "#0563C1"'),
	visitedLinkColor: z.string().optional().describe('hyperlink 已访问链接颜色'),
	linkToolTip: z.string().optional().describe("hyperlink 鼠标悬停提示文本"),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const setCellType: ToolDef<z.infer<typeof inputSchema>> = {
	name: "set_cell_type",
	displayName: "设置单元格类型",
	module: "cell_type",
	description:
		"设置指定范围的单元格类型（控件）。" +
		"\n示例：复选框 → type='checkbox', caption='已完成'" +
		"\n示例：下拉框 → type='combobox', items=['苹果','香蕉','橙子']" +
		"\n示例：按钮 → type='button', text='点击'" +
		"\n示例：超链接 → type='hyperlink'（需要配合单元格值设置 URL）",
	inputSchema,
	handler: async (workbook, input) => {
		const { setCellType: bridgeSet } = await import("@/lib/spreadjs/bridge/cell-type");
		const range = resolveAddress(input.range);
		return bridgeSet(workbook, input.sheetName ?? range.sheetName, {
			row: range.row,
			col: range.col,
			rowCount: range.rowCount,
			colCount: range.colCount,
			type: input.type,
			caption: input.caption,
			isThreeState: input.isThreeState,
			textTrue: input.textTrue,
			textFalse: input.textFalse,
			items: input.items,
			editable: input.editable,
			text: input.text,
			buttonBackColor: input.buttonBackColor,
			linkColor: input.linkColor,
			visitedLinkColor: input.visitedLinkColor,
			linkToolTip: input.linkToolTip,
		});
	},
};

export default setCellType;
