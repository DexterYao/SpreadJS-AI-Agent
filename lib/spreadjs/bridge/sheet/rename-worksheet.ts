import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function renameWorksheet(
	workbook: SpreadWorkbook,
	oldName: string,
	newName: string,
) {
	return safe(() => {
		const sheet = getSheet(workbook, oldName);
		sheet.name(newName);
		return null;
	});
}
