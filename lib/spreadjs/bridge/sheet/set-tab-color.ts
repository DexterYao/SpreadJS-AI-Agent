import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, normalizeColor, safe } from "../internal";

export function setTabColor(
	workbook: SpreadWorkbook,
	name: string,
	color: string,
) {
	return safe(() => {
		const sheet = getSheet(workbook, name);
		sheet.options.sheetTabColor = normalizeColor(color);
		return { name, sheetTabColor: sheet.options.sheetTabColor };
	});
}
