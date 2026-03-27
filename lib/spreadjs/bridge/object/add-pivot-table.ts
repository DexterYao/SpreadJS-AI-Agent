import type { SpreadWorkbook, SpreadWorksheet } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { safe } from "../internal";

export function addPivotTable(
	workbook: SpreadWorkbook,
	input: {
		sourceRange: string; pivotTableName?: string;
		targetSheetName?: string; row: number; col: number;
		layout: string;
		fields: Array<{
			sourceName: string; displayName?: string;
			area: string; subtotal?: string;
		}>;
	},
) {
	return safe(() => {
		const Pivot = GC.Spread.Pivot;

		// 确定目标 sheet
		let targetSheet: SpreadWorksheet;
		if (input.targetSheetName) {
			const existing = workbook.getSheetFromName(input.targetSheetName);
			if (existing) {
				targetSheet = existing;
			} else {
				const idx = workbook.getSheetCount();
				workbook.addSheet(idx);
				const newSheet = workbook.getSheet(idx);
				newSheet.name(input.targetSheetName);
				targetSheet = newSheet;
			}
		} else {
			// 新建工作表
			const idx = workbook.getSheetCount();
			workbook.addSheet(idx);
			targetSheet = workbook.getSheet(idx);
			targetSheet.name(`PivotSheet_${idx + 1}`);
		}

		const layoutMap: Record<string, number> = {
			compact: Pivot.PivotTableLayoutType.compact,
			outline: Pivot.PivotTableLayoutType.outline,
			tabular: Pivot.PivotTableLayoutType.tabular,
		};

		const name = input.pivotTableName || `PivotTable_${Date.now()}`;
		const layout = layoutMap[input.layout] ?? Pivot.PivotTableLayoutType.compact;
		const theme = Pivot.PivotTableThemes.medium2;

		const pt = targetSheet.pivotTables.add(
			name, input.sourceRange, input.row, input.col, layout, theme,
		);

		// 区域枚举: 0=filter, 1=row, 2=column, 3=value
		const areaMap: Record<string, number> = { filter: 0, row: 1, column: 2, value: 3 };

		// GC.Pivot.SubtotalType 枚举值（直接用数值避免命名空间层级问题）
		const subtotalMap: Record<string, number> = {
			sum: 8, count: 1, average: 0, max: 3, min: 4,
			countNums: 2, stdDev: 6, stdDevP: 7, var: 9, varP: 10,
		};

		for (const field of input.fields) {
			const area = areaMap[field.area] ?? 1;
			const displayName = field.displayName || field.sourceName;
			if (area === 3) {
				pt.add(field.sourceName, displayName, area, subtotalMap[field.subtotal || "sum"]);
			} else {
				pt.add(field.sourceName, displayName, area);
			}
		}

		workbook.setActiveSheet(targetSheet.name());
		return {
			pivotTableName: name,
			sheetName: targetSheet.name(),
			fieldCount: input.fields.length,
		};
	});
}
