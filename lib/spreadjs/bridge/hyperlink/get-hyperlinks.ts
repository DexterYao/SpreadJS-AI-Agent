import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, getUsedRange, safe } from "../internal";

interface HyperlinkInfo {
	row: number;
	col: number;
	url?: string;
	tooltip?: string;
	linkColor?: string;
	visitedLinkColor?: string;
}

export function getHyperlinks(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row?: number,
	col?: number,
	rowCount?: number,
	colCount?: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);

		// 如果未指定范围，扫描已使用区域
		let startRow = row ?? 0;
		let startCol = col ?? 0;
		let rows = rowCount ?? 0;
		let cols = colCount ?? 0;

		if (row === undefined || rowCount === undefined) {
			const used = getUsedRange(sheet);
			if (!used) return { count: 0, hyperlinks: [] };
			startRow = used.row;
			startCol = used.col;
			rows = used.rowCount;
			cols = used.colCount;
		}

		const results: HyperlinkInfo[] = [];

		for (let r = startRow; r < startRow + rows; r++) {
			for (let c = startCol; c < startCol + cols; c++) {
				const hl = sheet.getHyperlink(r, c);
				if (!hl) continue;
				const info: HyperlinkInfo = { row: r, col: c };
				if (hl.url) info.url = hl.url;
				if (hl.tooltip) info.tooltip = hl.tooltip;
				if (hl.linkColor) info.linkColor = hl.linkColor;
				if (hl.visitedLinkColor) info.visitedLinkColor = hl.visitedLinkColor;
				results.push(info);
			}
		}

		return { count: results.length, hyperlinks: results };
	});
}
