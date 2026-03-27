import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

const TargetType = GC.Spread.Sheets.Hyperlink.HyperlinkTargetType;

const targetMap: Record<string, number> = {
	blank: TargetType.blank,
	self: TargetType.self,
	parent: TargetType.parent,
	top: TargetType.top,
};

export interface SetHyperlinkInput {
	row: number;
	col: number;
	url: string;
	tooltip?: string;
	target?: string;
	linkColor?: string;
	visitedLinkColor?: string;
	drawUnderline?: boolean;
}

export function setHyperlink(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	input: SetHyperlinkInput,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);

		const hyperlinkData: GC.Spread.Sheets.IHyperlink = {
			url: input.url,
		};
		if (input.tooltip) hyperlinkData.tooltip = input.tooltip;
		if (input.target) {
			const t = targetMap[input.target];
			if (t === undefined) {
				throw new Error(`未知的 target: ${input.target}。可选: ${Object.keys(targetMap).join(", ")}`);
			}
			hyperlinkData.target = t;
		}
		if (input.linkColor) hyperlinkData.linkColor = input.linkColor;
		if (input.visitedLinkColor) hyperlinkData.visitedLinkColor = input.visitedLinkColor;
		if (input.drawUnderline !== undefined) hyperlinkData.drawUnderline = input.drawUnderline;

		sheet.setHyperlink(input.row, input.col, hyperlinkData);

		// 如果单元格没有文本值，自动设置 url 作为显示文本
		const currentValue = sheet.getValue(input.row, input.col);
		if (currentValue === null || currentValue === undefined || currentValue === "") {
			sheet.setValue(input.row, input.col, input.url);
		}

		return {
			row: input.row,
			col: input.col,
			url: input.url,
			tooltip: input.tooltip,
		};
	});
}
