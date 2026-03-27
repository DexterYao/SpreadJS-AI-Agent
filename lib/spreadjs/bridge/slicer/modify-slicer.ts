import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

export function modifySlicer(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		style?: string;
		caption?: string;
		// slicer 系（table + pivotTable）
		columnCount?: number;
		itemHeight?: number;
		showNoDataItems?: boolean;
		// pivot 系（pivotTable + pivotTimeline）
		connectPivotTable?: string;
		disconnectPivotTable?: string;
		// timeline 专属
		timelineLevel?: "years" | "quarters" | "months" | "days";
		showTimeLevel?: boolean;
		showHorizontalScrollbar?: boolean;
		showSelectionLabel?: boolean;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const slicer = sheet.slicers.get(input.name);
		if (!slicer) throw new Error(`切片器 "${input.name}" 不存在`);

		// 通用 shape 属性
		if (input.x !== undefined || input.y !== undefined) {
			const curX = input.x ?? (slicer.x() as number);
			const curY = input.y ?? (slicer.y() as number);
			slicer.position(new GC.Spread.Sheets.Point(curX, curY));
		}
		if (input.width !== undefined) slicer.width(input.width);
		if (input.height !== undefined) slicer.height(input.height);

		// 样式：直接传字符串名称
		if (input.style !== undefined) {
			slicer.style(input.style);
		}

		// 通用 slicer base
		if (input.caption !== undefined) {
			slicer.captionName(input.caption);
		}

		// slicer 系属性（table + pivotTable item slicer）
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const s = slicer as any;
		if (input.columnCount !== undefined && typeof s.columnCount === "function") {
			s.columnCount(input.columnCount);
		}
		if (input.itemHeight !== undefined && typeof s.itemHeight === "function") {
			s.itemHeight(input.itemHeight);
		}
		if (input.showNoDataItems !== undefined && typeof s.showNoDataItems === "function") {
			s.showNoDataItems(input.showNoDataItems);
		}

		// pivot 系属性（pivotTable + pivotTimeline）
		if (input.connectPivotTable && typeof s.connectPivotTable === "function") {
			s.connectPivotTable(input.connectPivotTable);
		}
		if (input.disconnectPivotTable && typeof s.disconnectPivotTable === "function") {
			s.disconnectPivotTable(input.disconnectPivotTable);
		}

		// timeline 专属
		if (input.timelineLevel !== undefined && typeof s.level === "function") {
			const levelMap = {
				years: GC.Spread.Sheets.Slicers.TimelineLevel.years,
				quarters: GC.Spread.Sheets.Slicers.TimelineLevel.quarters,
				months: GC.Spread.Sheets.Slicers.TimelineLevel.months,
				days: GC.Spread.Sheets.Slicers.TimelineLevel.days,
			};
			s.level(levelMap[input.timelineLevel]);
		}
		if (input.showTimeLevel !== undefined && typeof s.showTimeLevel === "function") {
			s.showTimeLevel(input.showTimeLevel);
		}
		if (input.showHorizontalScrollbar !== undefined && typeof s.showHorizontalScrollbar === "function") {
			s.showHorizontalScrollbar(input.showHorizontalScrollbar);
		}
		if (input.showSelectionLabel !== undefined && typeof s.showSelectionLabel === "function") {
			s.showSelectionLabel(input.showSelectionLabel);
		}

		const modified: string[] = [];
		if (input.x !== undefined || input.y !== undefined) modified.push("position");
		if (input.width !== undefined) modified.push("width");
		if (input.height !== undefined) modified.push("height");
		if (input.style !== undefined) modified.push("style");
		if (input.caption !== undefined) modified.push("caption");
		if (input.columnCount !== undefined) modified.push("columnCount");
		if (input.itemHeight !== undefined) modified.push("itemHeight");
		if (input.showNoDataItems !== undefined) modified.push("showNoDataItems");
		if (input.connectPivotTable) modified.push("connectPivotTable");
		if (input.disconnectPivotTable) modified.push("disconnectPivotTable");
		if (input.timelineLevel !== undefined) modified.push("timelineLevel");
		if (input.showTimeLevel !== undefined) modified.push("showTimeLevel");
		if (input.showHorizontalScrollbar !== undefined) modified.push("showHorizontalScrollbar");
		if (input.showSelectionLabel !== undefined) modified.push("showSelectionLabel");

		return { name: input.name, modified };
	});
}
