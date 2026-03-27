import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { safe } from "../internal";

export function createWorksheet(
	workbook: SpreadWorkbook,
	name: string,
	index?: number,
) {
	return safe(() => {
		const prevIdx = workbook.getActiveSheetIndex();
		const sheet = new GC.Spread.Sheets.Worksheet(name);
		const insertAt = index ?? workbook.getSheetCount();
		workbook.addSheet(insertAt, sheet);
		// addSheet 会自动切换活动表，恢复到用户原来的位置
		workbook.setActiveSheetIndex(prevIdx);
		return { name, index: insertAt };
	});
}
