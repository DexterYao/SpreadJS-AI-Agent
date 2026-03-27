import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, getUsedRange, safe } from "../internal";
import { colIndexToLetter } from "@/lib/spreadjs/utils";

interface CommentInfo {
	row: number;
	col: number;
	address: string;
	text: string;
}

/**
 * 获取 sheet 上的批注。
 * 若指定 range 则只返回范围内的批注；否则扫描 usedRange 收集全部。
 */
export function getComments(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	range?: { row: number; col: number; rowCount: number; colCount: number },
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const scanArea = range ?? getUsedRange(sheet);

		const comments: CommentInfo[] = [];
		if (!scanArea) {
			return { sheetName: sheet.name(), count: 0, comments };
		}

		const endRow = scanArea.row + scanArea.rowCount;
		const endCol = scanArea.col + scanArea.colCount;
		for (let r = scanArea.row; r < endRow; r++) {
			for (let c = scanArea.col; c < endCol; c++) {
				const comment = sheet.comments.get(r, c);
				if (comment) {
					comments.push({
						row: r,
						col: c,
						address: `${colIndexToLetter(c)}${r + 1}`,
						text: comment.text(),
					});
				}
			}
		}

		return {
			sheetName: sheet.name(),
			count: comments.length,
			comments,
		};
	});
}
