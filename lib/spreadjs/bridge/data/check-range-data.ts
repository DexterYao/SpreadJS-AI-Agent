import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import { getSheet, getUsedRange } from "../internal";

/** 检测指定区域中实际会被写入的稀疏单元格是否存在已有数据 */
export function checkSparseDataConflict(
	workbook: SpreadWorkbook,
	baseRange: ResolvedRange,
	data: Array<unknown[] | null>,
): { hasData: boolean; nonEmptyCount: number } {
	const sheet = getSheet(workbook, baseRange.sheetName);
	let nonEmptyCount = 0;

	for (let r = 0; r < data.length; r++) {
		const row = data[r];
		if (!row) continue;
		for (let c = 0; c < row.length; c++) {
			if (row[c] === null || row[c] === undefined) continue;
			const existing = sheet.getValue(baseRange.row + r, baseRange.col + c);
			if (existing !== null && existing !== undefined && existing !== "") {
				nonEmptyCount++;
			}
		}
	}

	return { hasData: nonEmptyCount > 0, nonEmptyCount };
}

/** 检测指定区域是否存在已有数据 */
export function checkRangeHasData(
	workbook: SpreadWorkbook,
	range: ResolvedRange,
): { hasData: boolean; nonEmptyCount: number } {
	const sheet = getSheet(workbook, range.sheetName);
	let nonEmptyCount = 0;

	for (let r = range.row; r < range.row + range.rowCount; r++) {
		for (let c = range.col; c < range.col + range.colCount; c++) {
			const val = sheet.getValue(r, c);
			if (val !== null && val !== undefined && val !== "") {
				nonEmptyCount++;
			}
		}
	}

	return { hasData: nonEmptyCount > 0, nonEmptyCount };
}

/** 检测指定行或列区域是否存在已有数据 */
export function checkRowsColsHaveData(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	direction: "row" | "column",
	index: number,
	count: number,
): { hasData: boolean; nonEmptyCount: number } {
	const sheet = getSheet(workbook, sheetName);
	const used = getUsedRange(sheet);
	if (!used) return { hasData: false, nonEmptyCount: 0 };

	let nonEmptyCount = 0;

	if (direction === "row") {
		const maxCol = used.col + used.colCount;
		for (let r = index; r < index + count; r++) {
			for (let c = 0; c < maxCol; c++) {
				const val = sheet.getValue(r, c);
				if (val !== null && val !== undefined && val !== "") {
					nonEmptyCount++;
				}
			}
		}
	} else {
		const maxRow = used.row + used.rowCount;
		for (let r = 0; r < maxRow; r++) {
			for (let c = index; c < index + count; c++) {
				const val = sheet.getValue(r, c);
				if (val !== null && val !== undefined && val !== "") {
					nonEmptyCount++;
				}
			}
		}
	}

	return { hasData: nonEmptyCount > 0, nonEmptyCount };
}
