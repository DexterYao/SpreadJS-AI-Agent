import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

interface ModifyChartInput {
	chartName: string;
	sheetName?: string;
	title?: string;
	chartType?: string;
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	dataRange?: string;
}

export function modifyChart(workbook: SpreadWorkbook, input: ModifyChartInput) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const chart = sheet.charts.get(input.chartName);
		if (!chart) throw new Error(`图表 "${input.chartName}" 不存在`);

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

		const modified: string[] = [];

		if (input.title !== undefined) {
			const titleObj = chart.title();
			titleObj.text = input.title;
			chart.title(titleObj);
			modified.push("title");
		}

		if (input.chartType !== undefined) {
			const gcType = chartTypeMap[input.chartType];
			if (gcType !== undefined) {
				chart.chartType(gcType);
				modified.push("chartType");
			}
		}

		if (input.width !== undefined) { chart.width(input.width); modified.push("width"); }
		if (input.height !== undefined) { chart.height(input.height); modified.push("height"); }
		if (input.x !== undefined) { chart.x(input.x); modified.push("x"); }
		if (input.y !== undefined) { chart.y(input.y); modified.push("y"); }

		if (input.dataRange !== undefined) {
			chart.dataRange(input.dataRange);
			modified.push("dataRange");
		}

		sheet.repaint();
		return { chartName: input.chartName, modified };
	});
}
