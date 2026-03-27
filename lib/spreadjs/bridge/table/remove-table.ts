import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

export function removeTable(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		keepData?: boolean;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const table = sheet.tables.findByName(input.name);
		if (!table) throw new Error(`表格 "${input.name}" 不存在`);

		const keepData = input.keepData !== false;
		const option = keepData
			? GC.Spread.Sheets.Tables.TableRemoveOptions.keepData
			: GC.Spread.Sheets.Tables.TableRemoveOptions.none;

		sheet.tables.remove(table, option);
		return { removed: input.name, keepData };
	});
}
