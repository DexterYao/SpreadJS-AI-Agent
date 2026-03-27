import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function removeHyperlink(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row: number,
	col: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);

		const existing = sheet.getHyperlink(row, col);
		if (!existing) {
			throw new Error(`单元格 (${row}, ${col}) 没有超链接`);
		}

		// 传 null 移除超链接
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		sheet.setHyperlink(row, col, null as any);

		return { removed: true, row, col };
	});
}
