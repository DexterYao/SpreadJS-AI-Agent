import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

/**
 * 清除指定范围的所有单元格状态样式。
 * SpreadJS CellStateManager 只提供 clear(range) 方法，会移除该范围上全部状态类型的样式。
 */
export function removeCellState(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row: number,
	col: number,
	rowCount: number,
	colCount: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const range = new GC.Spread.Sheets.Range(row, col, rowCount, colCount);
		sheet.cellStates.clear(range, GC.Spread.Sheets.SheetArea.viewport);
		return { cleared: true, range: { row, col, rowCount, colCount } };
	});
}
