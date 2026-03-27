import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function removeShape(
	workbook: SpreadWorkbook,
	input: { name: string; sheetName?: string },
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const shape = sheet.shapes.get(input.name);
		if (!shape) throw new Error(`形状 "${input.name}" 不存在`);
		sheet.shapes.remove(input.name);
		return { removed: input.name };
	});
}
