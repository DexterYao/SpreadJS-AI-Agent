import type { SpreadWorkbook, WorkbookMeta, SheetMeta } from "@/lib/agent/types";
import { getUsedRange, safe } from "../internal";

export function getWorkbookMetadata(workbook: SpreadWorkbook) {
	return safe<WorkbookMeta>(() => {
		const sheetCount = workbook.getSheetCount();
		const activeIdx = workbook.getActiveSheetIndex();
		const sheets: SheetMeta[] = [];

		for (let i = 0; i < sheetCount; i++) {
			const sheet = workbook.getSheet(i);
			sheets.push({
				name: sheet.name(),
				index: i,
				rowCount: sheet.getRowCount(),
				colCount: sheet.getColumnCount(),
				usedRange: getUsedRange(sheet),
				isActive: i === activeIdx,
			});
		}

		return { sheetCount, activeSheetIndex: activeIdx, sheets };
	});
}
