import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

type SlicerType = "table" | "pivotTable" | "pivotTimeline";

export function addSlicer(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		targetName: string;
		columnName: string;
		type?: SlicerType;
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		style?: string;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const slicerType = input.type ?? "table";

		// 根据类型解析 SlicerType 枚举和样式
		const typeEnum = GC.Spread.Sheets.Slicers.SlicerType;
		const typeMap = {
			table: typeEnum.table,
			pivotTable: typeEnum.pivotTable,
			pivotTimeline: typeEnum.pivotTimeline,
		} as const;

		// 先创建，style 不传给 add()，创建后单独设置
		const slicer = sheet.slicers.add(
			input.name,
			input.targetName,
			input.columnName,
			undefined,
			typeMap[slicerType] as GC.Spread.Sheets.Slicers.SlicerType,
		);
		if (!slicer) {
			throw new Error(
				`创建切片器失败：请确认 targetName="${input.targetName}" 是有效的${slicerType === "table" ? "表格" : "透视表"}名称，` +
				`且 columnName="${input.columnName}" 是有效字段${slicerType === "pivotTimeline" ? "（必须为日期类型）" : ""}`,
			);
		}

		// 样式在创建后设置
		if (input.style) {
			slicer.style(input.style);
		}

		if (input.x !== undefined || input.y !== undefined) {
			slicer.position(new GC.Spread.Sheets.Point(
				input.x ?? 0,
				input.y ?? 0,
			));
		}
		if (input.width !== undefined) slicer.width(input.width);
		if (input.height !== undefined) slicer.height(input.height);

		return {
			name: input.name,
			targetName: input.targetName,
			columnName: input.columnName,
			type: slicerType,
			style: input.style,
		};
	});
}
