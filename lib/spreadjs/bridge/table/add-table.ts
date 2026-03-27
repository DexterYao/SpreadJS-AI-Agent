import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";
import { resolveAddress } from "@/lib/spreadjs/utils";

export function addTable(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		range: string;
		theme?: string;
		sheetName?: string;
		hasHeaders?: boolean;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const r = resolveAddress(input.range);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const themes = GC.Spread.Sheets.Tables.TableThemes as any;
		const theme = input.theme
			? themes[input.theme] ?? input.theme
			: themes.medium2;

		const table = sheet.tables.add(
			input.name, r.row, r.col, r.rowCount, r.colCount, theme as string,
		);

		if (input.hasHeaders === false) {
			table.showHeader(false);
		}

		return {
			name: table.name(),
			range: input.range,
			theme: table.getStyleName?.() ?? input.theme ?? "medium2",
		};
	});
}
