import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import { colLetterToIndex } from "@/lib/spreadjs/utils";
import { getSheet, safe } from "../internal";

export function sortRange(
	workbook: SpreadWorkbook,
	range: ResolvedRange,
	sortKeys: Array<{ column: string; ascending: boolean }>,
) {
	return safe(() => {
		const sheet = getSheet(workbook, range.sheetName);
		const sortInfo = sortKeys.map((key) => ({
			index: colLetterToIndex(key.column.toUpperCase()),
			ascending: key.ascending,
		}));

		const success = sheet.sortRange(
			range.row, range.col, range.rowCount, range.colCount,
			true, // byRows
			sortInfo,
		);
		return { sorted: success };
	});
}
