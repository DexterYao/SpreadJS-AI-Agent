import type { ResolvedRange } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { normalizeColor } from "../internal";

export const CF = GC.Spread.Sheets.ConditionalFormatting;

/** 将字符串映射到 ScaleValueType 枚举 */
export function toScaleValueType(s: string): number {
	const map: Record<string, number> = {
		number: CF.ScaleValueType.number,
		lowestValue: CF.ScaleValueType.lowestValue,
		highestValue: CF.ScaleValueType.highestValue,
		percent: CF.ScaleValueType.percent,
		percentile: CF.ScaleValueType.percentile,
		formula: CF.ScaleValueType.formula,
		automin: CF.ScaleValueType.automin,
		automax: CF.ScaleValueType.automax,
	};
	return map[s] ?? CF.ScaleValueType.number;
}

/** 构建条件格式用 Range 数组（支持单个或多个 ResolvedRange） */
export function toRanges(range: ResolvedRange | ResolvedRange[]) {
	const arr = Array.isArray(range) ? range : [range];
	return arr.map((r) => new GC.Spread.Sheets.Range(r.row, r.col, r.rowCount, r.colCount));
}

/** 构建条件格式用 Style */
export function toCondStyle(style: { backColor?: string; foreColor?: string; bold?: boolean; italic?: boolean }) {
	const s = new GC.Spread.Sheets.Style();
	if (style.backColor) s.backColor = normalizeColor(style.backColor);
	if (style.foreColor) s.foreColor = normalizeColor(style.foreColor);
	if (style.bold !== undefined || style.italic !== undefined) {
		s.font = `${style.bold ? "bold " : ""}${style.italic ? "italic " : ""}11pt Calibri`;
	}
	return s;
}
