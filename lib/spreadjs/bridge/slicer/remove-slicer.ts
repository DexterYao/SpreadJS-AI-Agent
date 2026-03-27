import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function removeSlicer(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const slicer = sheet.slicers.get(input.name);
		if (!slicer) throw new Error(`切片器 "${input.name}" 不存在`);

		sheet.slicers.remove(input.name);
		return { removed: input.name };
	});
}
