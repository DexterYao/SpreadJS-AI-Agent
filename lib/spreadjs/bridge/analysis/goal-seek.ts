import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { parseRangeAddress } from "@/lib/spreadjs/utils";
import { getSheet, safe } from "../internal";

export function goalSeek(
	workbook: SpreadWorkbook,
	targetCell: string,
	targetValue: number,
	changingCell: string,
) {
	return safe(() => {
		const target = parseRangeAddress(targetCell);
		const changing = parseRangeAddress(changingCell);

		const targetSheet = getSheet(workbook, target.sheetName);
		const changingSheet = getSheet(workbook, changing.sheetName);

		// 验证目标单元格包含公式
		const formula = targetSheet.getFormula(target.startRow, target.startCol);
		if (!formula) throw new Error(`目标单元格 ${targetCell} 不包含公式`);

		const found = GC.Spread.Sheets.CalcEngine.goalSeek(
			changingSheet, changing.startRow, changing.startCol,
			targetSheet, target.startRow, target.startCol,
			targetValue,
		);

		if (!found) throw new Error("目标求解未找到解");

		const resultValue = changingSheet.getValue(changing.startRow, changing.startCol);
		const formulaResult = targetSheet.getValue(target.startRow, target.startCol);

		return {
			found: true,
			changingCellValue: resultValue,
			formulaResult,
		};
	});
}
