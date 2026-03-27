import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import { colIndexToLetter } from "@/lib/spreadjs/utils";
import { getSheet, safe, withSuspend } from "../internal";

export function writeData(
	workbook: SpreadWorkbook,
	range: ResolvedRange,
	data: Array<unknown[] | null>,
) {
	return safe(() => {
		const sheet = getSheet(workbook, range.sheetName);
		const formulaCells: Array<{ row: number; col: number; formula: string }> = [];

		withSuspend(sheet, () => {
			for (let r = 0; r < data.length; r++) {
				const row = data[r];
				if (!row) continue; // 稀疏：null 行跳过
				for (let c = 0; c < row.length; c++) {
					const val = row[c];
					if (val === null || val === undefined) continue; // 稀疏：null cell 跳过
					const targetRow = range.row + r;
					const targetCol = range.col + c;
					if (typeof val === "string" && val.startsWith("=")) {
						sheet.setFormula(targetRow, targetCol, val);
						formulaCells.push({ row: targetRow, col: targetCol, formula: val });
					} else {
						sheet.setValue(targetRow, targetCol, val);
					}
				}
			}
		});

		// 公式结果校验：检测 #VALUE!、#NAME?、#REF! 等错误
		const formulaErrors: Array<{ cell: string; formula: string; error: string }> = [];
		for (const fc of formulaCells) {
			const text = sheet.getText(fc.row, fc.col);
			if (typeof text === "string" && /^#[A-Z/]+[!?]?$/.test(text)) {
				formulaErrors.push({
					cell: `${colIndexToLetter(fc.col)}${fc.row + 1}`,
					formula: fc.formula,
					error: text,
				});
			}
		}

		return {
			writtenRows: data.length,
			...(formulaErrors.length > 0 && { formulaErrors }),
		};
	});
}
