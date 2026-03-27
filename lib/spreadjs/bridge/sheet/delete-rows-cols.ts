import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe, withSuspend } from "../internal";

export function deleteRowsCols(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	direction: "row" | "column",
	index: number,
	count: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		withSuspend(sheet, () => {
			if (direction === "row") {
				sheet.deleteRows(index, count);
			} else {
				sheet.deleteColumns(index, count);
			}
		});
		return { direction, index, count };
	});
}
