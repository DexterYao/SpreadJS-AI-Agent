import type { SpreadWorkbook, SpreadWorksheet } from "@/lib/agent/types";
import { MAX_SEARCH_RESULTS, TRIM_SEARCH_RESULTS } from "@/lib/config";
import { getSheet, getUsedRange, safe, truncateStrings } from "../internal";

export function searchData(
	workbook: SpreadWorkbook,
	keyword: string,
	options: { sheetName?: string; regex?: boolean; matchCase?: boolean },
) {
	return safe(() => {
		const results: Array<{ sheet: string; row: number; col: number; value: unknown }> = [];
		const searchSheets: SpreadWorksheet[] = [];

		if (options.sheetName) {
			searchSheets.push(getSheet(workbook, options.sheetName));
		} else {
			for (let i = 0; i < workbook.getSheetCount(); i++) {
				searchSheets.push(workbook.getSheet(i));
			}
		}

		for (const sheet of searchSheets) {
			const used = getUsedRange(sheet);
			if (!used) continue;

			const pattern = options.regex ? new RegExp(keyword, options.matchCase ? "" : "i") : null;

			for (let r = used.row; r < used.row + used.rowCount; r++) {
				for (let c = used.col; c < used.col + used.colCount; c++) {
					const text = sheet.getText(r, c);
					if (!text) continue;

					const matched = pattern
						? pattern.test(text)
						: options.matchCase
							? text.includes(keyword)
							: text.toLowerCase().includes(keyword.toLowerCase());

					if (matched) {
						results.push({ sheet: sheet.name(), row: r, col: c, value: sheet.getValue(r, c) });
					}

					if (results.length >= MAX_SEARCH_RESULTS) break;
				}
				if (results.length >= MAX_SEARCH_RESULTS) break;
			}
			if (results.length >= MAX_SEARCH_RESULTS) break;
		}

		// 软裁剪：超过阈值时只返回前 N 条 + 总数
		if (results.length > TRIM_SEARCH_RESULTS) {
			return {
				matches: truncateStrings(results.slice(0, TRIM_SEARCH_RESULTS)),
				totalMatches: results.length,
				trimmedAfter: TRIM_SEARCH_RESULTS,
			};
		}
		return truncateStrings(results);
	});
}
