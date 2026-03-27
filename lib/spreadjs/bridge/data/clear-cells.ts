import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

export function clearCells(
	workbook: SpreadWorkbook,
	range: ResolvedRange,
	clearType: "content" | "format" | "all",
) {
	return safe(() => {
		const sheet = getSheet(workbook, range.sheetName);
		const storageMap = {
			content: GC.Spread.Sheets.StorageType.data,
			format: GC.Spread.Sheets.StorageType.style,
			all: GC.Spread.Sheets.StorageType.data | GC.Spread.Sheets.StorageType.style,
		};
		sheet.clear(
			range.row, range.col, range.rowCount, range.colCount,
			GC.Spread.Sheets.SheetArea.viewport,
			storageMap[clearType],
		);
		return null;
	});
}
