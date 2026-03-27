import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

/** 移除指定区域的数据验证（设置 validator 为 null） */
export function removeValidation(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row: number,
	col: number,
	rowCount: number,
	colCount: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		for (let r = row; r < row + rowCount; r++) {
			for (let c = col; c < col + colCount; c++) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				sheet.setDataValidator(r, c, null as any);
			}
		}
		return { removed: true, range: { row, col, rowCount, colCount } };
	});
}
