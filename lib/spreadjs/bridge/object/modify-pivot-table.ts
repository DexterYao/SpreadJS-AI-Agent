import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

interface ModifyPivotInput {
	pivotTableName: string;
	sheetName?: string;
	addFields?: Array<{
		sourceName: string;
		displayName?: string;
		area: string;
		subtotal?: string;
	}>;
	removeFields?: string[];
}

export function modifyPivotTable(workbook: SpreadWorkbook, input: ModifyPivotInput) {
	return safe(() => {
		// 查找透视表所在 sheet
		let pt = null;
		const sheetCount = workbook.getSheetCount();

		if (input.sheetName) {
			const sheet = workbook.getSheetFromName(input.sheetName);
			if (!sheet) throw new Error(`工作表 "${input.sheetName}" 不存在`);
			pt = sheet.pivotTables.get(input.pivotTableName);
		} else {
			for (let i = 0; i < sheetCount; i++) {
				const sheet = workbook.getSheet(i);
				try {
					const found = sheet.pivotTables.get(input.pivotTableName);
					if (found) { pt = found; break; }
				} catch { /* ignore */ }
			}
		}

		if (!pt) throw new Error(`透视表 "${input.pivotTableName}" 不存在`);

		const areaMap: Record<string, number> = { filter: 0, row: 1, column: 2, value: 3 };
		const subtotalMap: Record<string, number> = {
			sum: 8, count: 1, average: 0, max: 3, min: 4,
			countNums: 2, stdDev: 6, stdDevP: 7, var: 9, varP: 10,
		};

		const modified: string[] = [];

		if (input.removeFields) {
			for (const fieldName of input.removeFields) {
				pt.remove(fieldName);
				modified.push(`removed:${fieldName}`);
			}
		}

		if (input.addFields) {
			for (const field of input.addFields) {
				const area = areaMap[field.area] ?? 1;
				const displayName = field.displayName || field.sourceName;
				if (area === 3) {
					pt.add(field.sourceName, displayName, area, subtotalMap[field.subtotal || "sum"]);
				} else {
					pt.add(field.sourceName, displayName, area);
				}
				modified.push(`added:${field.sourceName}→${field.area}`);
			}
		}

		return { pivotTableName: input.pivotTableName, modified };
	});
}
