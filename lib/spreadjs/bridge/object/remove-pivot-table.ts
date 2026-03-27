import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

export function removePivotTable(
	workbook: SpreadWorkbook,
	pivotTableName: string,
	sheetName?: string,
) {
	return safe(() => {
		if (sheetName) {
			const sheet = workbook.getSheetFromName(sheetName);
			if (!sheet) throw new Error(`工作表 "${sheetName}" 不存在`);
			sheet.pivotTables.remove(pivotTableName);
			return { removed: pivotTableName, sheet: sheetName };
		}

		// 遍历所有 sheet 查找
		for (let i = 0; i < workbook.getSheetCount(); i++) {
			const sheet = workbook.getSheet(i);
			try {
				const pt = sheet.pivotTables.get(pivotTableName);
				if (pt) {
					sheet.pivotTables.remove(pivotTableName);
					return { removed: pivotTableName, sheet: sheet.name() };
				}
			} catch { /* ignore */ }
		}

		throw new Error(`透视表 "${pivotTableName}" 不存在`);
	});
}
