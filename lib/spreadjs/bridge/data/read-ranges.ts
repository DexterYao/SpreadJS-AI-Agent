import type { SpreadWorkbook, CellData, ResolvedRange } from "@/lib/agent/types";
import { MAX_CELLS_PER_READ, TRIM_ROWS_KEEP, TRIM_ROWS_THRESHOLD } from "@/lib/config";
import { colIndexToLetter } from "@/lib/spreadjs/utils";
import { getSheet, safe, truncateStrings } from "../internal";

export function readRanges(workbook: SpreadWorkbook, ranges: ResolvedRange[]) {
	return safe(() => {
		const allCells: CellData[][] = [];
		let totalCells = 0;
		let totalRows = 0;

		for (const range of ranges) {
			const sheet = getSheet(workbook, range.sheetName);
			const cells: CellData[] = [];

			for (let r = range.row; r < range.row + range.rowCount; r++) {
				for (let c = range.col; c < range.col + range.colCount; c++) {
					if (totalCells >= MAX_CELLS_PER_READ) {
						cells.push({
							row: r, col: c,
							value: `[截断] 已达上限 ${MAX_CELLS_PER_READ} 个单元格`,
							formula: null,
							formattedText: "",
						});
						allCells.push(cells);
						return truncateStrings(allCells);
					}
					const rawFormula = sheet.getFormula(r, c);
					cells.push({
						row: r,
						col: c,
						value: sheet.getValue(r, c),
						formula: rawFormula ? `=${rawFormula}` : null,
						formattedText: sheet.getText(r, c) || "",
					});
					totalCells++;
				}
				totalRows++;
			}
			allCells.push(cells);
		}

		// 软裁剪：行数超阈值时只保留前 N 行 + 摘要
		if (totalRows > TRIM_ROWS_THRESHOLD) {
			const kept: CellData[][] = [];
			let keptRows = 0;
			for (const cells of allCells) {
				if (keptRows >= TRIM_ROWS_KEEP) break;
				const rowSet = new Set(cells.map((c) => c.row));
				const rowArr = [...rowSet].sort((a, b) => a - b);
				const cutoff = TRIM_ROWS_KEEP - keptRows;
				if (rowArr.length <= cutoff) {
					kept.push(cells);
					keptRows += rowArr.length;
				} else {
					const maxRow = rowArr[cutoff - 1];
					kept.push(cells.filter((c) => c.row <= maxRow));
					keptRows += cutoff;
				}
			}

			// 推断列类型
			const colTypes: Record<number, Set<string>> = {};
			let nullCount = 0;
			for (const cells of allCells) {
				for (const c of cells) {
					const t = c.value === null || c.value === undefined ? "null"
						: typeof c.value === "number" ? "number"
							: typeof c.value === "boolean" ? "boolean"
								: c.formula ? "formula" : "text";
					if (t === "null") nullCount++;
					(colTypes[c.col] ??= new Set()).add(t);
				}
			}
			const columnTypes: Record<string, string> = {};
			for (const [col, types] of Object.entries(colTypes)) {
				const filtered = new Set([...types].filter((t) => t !== "null"));
				columnTypes[colIndexToLetter(Number(col))] = filtered.size === 1 ? [...filtered][0] : "mixed";
			}

			return {
				data: truncateStrings(kept),
				_summary: {
					totalRows,
					keptRows: TRIM_ROWS_KEEP,
					totalCells,
					columnTypes,
					nullRatio: totalCells > 0 ? +(nullCount / totalCells).toFixed(2) : 0,
				},
			};
		}

		return truncateStrings(allCells);
	});
}
