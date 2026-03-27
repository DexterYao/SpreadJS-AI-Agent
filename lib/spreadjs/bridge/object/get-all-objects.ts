import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

export function getAllObjects(workbook: SpreadWorkbook, sheetName?: string) {
	return safe(() => {
		const charts: Array<Record<string, unknown>> = [];
		const pivotTables: Array<Record<string, unknown>> = [];

		const sheetsToScan = sheetName
			? [workbook.getSheetFromName(sheetName)]
			: Array.from({ length: workbook.getSheetCount() }, (_, i) => workbook.getSheet(i));

		for (const sheet of sheetsToScan) {
			if (!sheet) continue;
			const sName = sheet.name();

			// 图表
			try {
				const allCharts = sheet.charts.all();
				for (const chart of allCharts) {
					const titleObj = chart.title();
					charts.push({
						name: chart.name(),
						sheet: sName,
						chartType: chart.chartType(),
						title: titleObj?.text || "",
						x: chart.x(), y: chart.y(),
						width: chart.width(), height: chart.height(),
					});
				}
			} catch { /* sheet 可能没有 charts 插件 */ }

			// 透视表
			try {
				const allPT = sheet.pivotTables.all();
				for (const pt of allPT) {
					pivotTables.push({
						name: pt.name(),
						sheet: sName,
					});
				}
			} catch { /* sheet 可能没有 pivotTables */ }
		}

		return { charts, pivotTables };
	});
}
