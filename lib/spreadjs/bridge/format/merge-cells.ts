import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import { getSheet, safe, withSuspend } from "../internal";

export function mergeCells(
	workbook: SpreadWorkbook,
	range: ResolvedRange,
	action: "merge" | "unmerge",
) {
	return safe(() => {
		const sheet = getSheet(workbook, range.sheetName);

		withSuspend(sheet, () => {
			if (action === "merge") {
				sheet.addSpan(range.row, range.col, range.rowCount, range.colCount);
			} else {
				sheet.removeSpan(range.row, range.col);
			}
		});

		return { action, row: range.row, col: range.col };
	});
}
