import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { colIndexToLetter, parseRangeAddress } from "@/lib/spreadjs/utils";
import { safe } from "../internal";

interface FindReplaceInput {
	find: string;
	replace?: string;
	sheetName?: string;
	matchCase?: boolean;
	matchEntireCell?: boolean;
	useRegex?: boolean;
}

export function findAndReplace(workbook: SpreadWorkbook, input: FindReplaceInput) {
	return safe(() => {
		const Search = GC.Spread.Sheets.Search;

		let flags = 0;
		if (!input.matchCase) flags |= Search.SearchFlags.ignoreCase;
		if (input.matchEntireCell) flags |= Search.SearchFlags.exactMatch;
		if (input.useRegex) flags |= Search.SearchFlags.useWildCards;

		const condition = new Search.SearchCondition();
		condition.searchString = input.find;
		condition.searchFlags = flags;
		condition.searchOrder = Search.SearchOrder.nOrder;
		condition.searchTarget = Search.SearchFoundFlags.cellText;

		if (input.sheetName) {
			const sheetIndex = workbook.getSheetIndex(input.sheetName);
			if (sheetIndex === -1) throw new Error(`工作表 "${input.sheetName}" 不存在`);
			condition.startSheetIndex = sheetIndex;
			condition.endSheetIndex = sheetIndex;
		} else {
			condition.startSheetIndex = 0;
			condition.endSheetIndex = workbook.getSheetCount() - 1;
		}

		// 收集所有匹配
		const matches: Array<{ sheet: string; cell: string; value: string }> = [];
		let result = workbook.search(condition);

		while (result.searchFoundFlag !== Search.SearchFoundFlags.none && matches.length < 500) {
			const sheet = workbook.getSheet(result.foundSheetIndex);
			const foundCell = `${colIndexToLetter(result.foundColumnIndex)}${result.foundRowIndex + 1}`;
			matches.push({
				sheet: sheet.name(),
				cell: foundCell,
				value: String(result.foundString || ""),
			});
			// 继续搜索
			condition.startSheetIndex = result.foundSheetIndex;
			condition.rowStart = result.foundRowIndex;
			condition.columnStart = result.foundColumnIndex + 1;
			result = workbook.search(condition);

			// 避免重复找到同一个
			if (result.foundSheetIndex === condition.startSheetIndex
				&& result.foundRowIndex === condition.rowStart
				&& result.foundColumnIndex === (condition.columnStart! - 1)) break;
		}

		if (!input.replace || matches.length === 0) {
			return { matchCount: matches.length, matches: matches.slice(0, 50) };
		}

		// 替换
		let replaceCount = 0;
		for (const m of matches) {
			const sheet = workbook.getSheetFromName(m.sheet);
			if (!sheet) continue;
			const addr = parseRangeAddress(m.cell);
			const row = addr.startRow;
			const col = addr.startCol;
			const current = sheet.getText(row, col);
			if (input.useRegex) {
				const regex = new RegExp(input.find, input.matchCase ? "g" : "gi");
				sheet.setValue(row, col, current.replace(regex, input.replace));
			} else {
				const escaped = input.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const regex = new RegExp(escaped, input.matchCase ? "g" : "gi");
				sheet.setValue(row, col, current.replace(regex, input.replace));
			}
			replaceCount++;
		}

		return { matchCount: matches.length, replaceCount };
	});
}
