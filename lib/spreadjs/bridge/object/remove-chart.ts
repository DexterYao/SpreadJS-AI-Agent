import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function removeChart(
	workbook: SpreadWorkbook,
	chartName: string,
	sheetName?: string,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const chart = sheet.charts.get(chartName);
		if (!chart) throw new Error(`图表 "${chartName}" 不存在`);

		sheet.charts.remove(chartName);
		sheet.repaint();
		return { removed: chartName };
	});
}
