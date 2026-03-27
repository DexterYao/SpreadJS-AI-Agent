import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import { getSheet, normalizeColor, safe, withSuspend } from "../internal";
import { toScaleValueType, toRanges } from "./helpers";

export function addDataBar(
	workbook: SpreadWorkbook,
	range: ResolvedRange,
	input: { color: string; minType: string; minValue: number; maxType: string; maxValue: number },
) {
	return safe(() => {
		const sheet = getSheet(workbook, range.sheetName);
		const cfs = sheet.conditionalFormats;
		const ranges = toRanges(range);

		const color = normalizeColor(input.color);
		withSuspend(sheet, () => {
			cfs.addDataBarRule(
				toScaleValueType(input.minType), input.minValue,
				toScaleValueType(input.maxType), input.maxValue,
				color, ranges,
			);
		});
		return { color: input.color };
	});
}
