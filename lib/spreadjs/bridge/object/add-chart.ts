import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

export function addChart(
	workbook: SpreadWorkbook,
	input: {
		dataRange: string; chartType: string;
		chartName?: string; sheetName?: string;
		x: number; y: number; width: number; height: number;
		title?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const Charts = GC.Spread.Sheets.Charts;

		const chartTypeMap: Record<string, number> = {
			columnClustered: Charts.ChartType.columnClustered,
			columnStacked: Charts.ChartType.columnStacked,
			line: Charts.ChartType.line,
			lineMarkers: Charts.ChartType.lineMarkers,
			lineStacked: Charts.ChartType.lineStacked,
			pie: Charts.ChartType.pie,
			doughnut: Charts.ChartType.doughnut,
			barClustered: Charts.ChartType.barClustered,
			barStacked: Charts.ChartType.barStacked,
			area: Charts.ChartType.area,
			areaStacked: Charts.ChartType.areaStacked,
			scatter: Charts.ChartType.xyScatter,
		};

		const name = input.chartName || `Chart_${Date.now()}`;
		const gcChartType = chartTypeMap[input.chartType] ?? Charts.ChartType.columnClustered;

		const chart = sheet.charts.add(
			name, gcChartType,
			input.x, input.y, input.width, input.height,
			input.dataRange,
		);

		if (input.title && chart) {
			const titleObj = chart.title();
			titleObj.text = input.title;
			chart.title(titleObj);
		}

		sheet.repaint();
		return { chartName: name, chartType: input.chartType, dataRange: input.dataRange };
	});
}
