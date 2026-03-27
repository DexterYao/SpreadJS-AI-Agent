import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe, withSuspend } from "../internal";

export function autoFill(
	workbook: SpreadWorkbook,
	sourceRange: ResolvedRange,
	destRange: ResolvedRange,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sourceRange.sheetName);
		const start = new GC.Spread.Sheets.Range(
			sourceRange.row, sourceRange.col,
			sourceRange.rowCount, sourceRange.colCount,
		);
		const dest = new GC.Spread.Sheets.Range(
			destRange.row, destRange.col,
			destRange.rowCount, destRange.colCount,
		);

		withSuspend(sheet, () => {
			sheet.fillAuto(start, dest, {
				fillType: GC.Spread.Sheets.Fill.FillType.auto,
				series: GC.Spread.Sheets.Fill.FillSeries.column,
			});
		});

		return {
			filledRows: destRange.rowCount,
			filledCols: destRange.colCount,
		};
	});
}
