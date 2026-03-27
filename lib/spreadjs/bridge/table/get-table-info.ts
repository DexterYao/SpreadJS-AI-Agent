import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";
import { colIndexToLetter } from "@/lib/spreadjs/utils";

interface TableInfo {
	name: string;
	range: string;
	theme: string;
	showHeader: boolean;
	showFooter: boolean;
	bandRows: boolean;
	bandColumns: boolean;
	columns: string[];
}

function buildRangeString(r: { row: number; col: number; rowCount: number; colCount: number }) {
	const start = `${colIndexToLetter(r.col)}${r.row + 1}`;
	const endRow = r.row + r.rowCount - 1;
	const endCol = r.col + r.colCount - 1;
	return `${start}:${colIndexToLetter(endCol)}${endRow + 1}`;
}

function extractTableInfo(table: { name: () => string; range: () => { row: number; col: number; rowCount: number; colCount: number }; getStyleName?: () => string; showHeader: () => boolean; showFooter: () => boolean; bandRows: () => boolean; bandColumns: () => boolean; getColumnName: (i: number) => string }): TableInfo {
	const range = table.range();
	const columns: string[] = [];
	for (let i = 0; i < range.colCount; i++) {
		try { columns.push(table.getColumnName(i)); } catch { columns.push(`Column${i + 1}`); }
	}
	return {
		name: table.name(),
		range: buildRangeString(range),
		theme: table.getStyleName?.() ?? "unknown",
		showHeader: table.showHeader(),
		showFooter: table.showFooter(),
		bandRows: table.bandRows(),
		bandColumns: table.bandColumns(),
		columns,
	};
}

export function getTableInfo(
	workbook: SpreadWorkbook,
	input: {
		name?: string;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);

		if (input.name) {
			const table = sheet.tables.findByName(input.name);
			if (!table) throw new Error(`表格 "${input.name}" 不存在`);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return extractTableInfo(table as any);
		}

		const allTables = sheet.tables.all();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return allTables.map((t: any) => extractTableInfo(t));
	});
}
