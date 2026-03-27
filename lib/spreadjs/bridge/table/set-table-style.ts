import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

export function setTableStyle(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		theme: string;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const table = sheet.tables.findByName(input.name);
		if (!table) throw new Error(`表格 "${input.name}" 不存在`);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const themes = GC.Spread.Sheets.Tables.TableThemes as any;
		const themeObj = themes[input.theme];
		const themeName = themeObj && typeof themeObj.name === "function"
			? themeObj.name()
			: input.theme;

		table.style(themeName);
		return {
			table: input.name,
			newTheme: table.getStyleName?.() ?? themeName,
		};
	});
}
