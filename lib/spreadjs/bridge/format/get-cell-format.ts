import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { colIndexToLetter } from "@/lib/spreadjs/utils";
import { getSheet, safe } from "../internal";

export function getCellFormat(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row: number,
	col: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const style = sheet.getActualStyle(row, col);
		const value = sheet.getValue(row, col);
		const text = sheet.getText(row, col);
		const formula = sheet.getFormula(row, col);

		const result: Record<string, unknown> = {
			cell: `${colIndexToLetter(col)}${row + 1}`,
			value,
			formattedText: text,
		};

		if (formula) result.formula = formula;

		if (style) {
			const format: Record<string, unknown> = {};
			if (style.backColor) format.backColor = style.backColor;
			if (style.foreColor) format.foreColor = style.foreColor;
			if (style.font) format.font = style.font;
			if (style.hAlign !== undefined) format.hAlign = style.hAlign;
			if (style.vAlign !== undefined) format.vAlign = style.vAlign;
			if (style.wordWrap) format.wordWrap = style.wordWrap;
			if (style.formatter) format.formatter = style.formatter;
			if (style.textIndent) format.textIndent = style.textIndent;

			if (style.borderTop) format.borderTop = describeBorder(style.borderTop);
			if (style.borderBottom) format.borderBottom = describeBorder(style.borderBottom);
			if (style.borderLeft) format.borderLeft = describeBorder(style.borderLeft);
			if (style.borderRight) format.borderRight = describeBorder(style.borderRight);

			result.format = format;
		}

		// 合并信息
		const spans = sheet.getSpans(new GC.Spread.Sheets.Range(row, col, 1, 1));
		if (spans && spans.length > 0) {
			const span = spans[0];
			if (span.rowCount > 1 || span.colCount > 1) {
				result.mergedRange = {
					row: span.row, col: span.col,
					rowCount: span.rowCount, colCount: span.colCount,
				};
			}
		}

		return result;
	});
}

function describeBorder(border: { color?: string; style?: number }) {
	return { color: border.color, style: border.style };
}
