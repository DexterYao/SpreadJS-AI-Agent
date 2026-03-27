import type { SpreadWorkbook } from "@/lib/agent/types";
import { colIndexToLetter } from "@/lib/spreadjs/utils";
import { getSheet, safe, withSuspend } from "../internal";

export function setCell(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row: number,
	col: number,
	value: unknown,
	type: "string" | "number" | "boolean" | "null" | undefined,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const isFormula = typeof value === "string" && value.startsWith("=");
		let resultValue = value;
		if (type === "number") {
			resultValue = Number(value);
		} else if (type === "boolean") {
			resultValue = Boolean(value);
		} else if (type === "null") {
			resultValue = null;
		}

		withSuspend(sheet, () => {
			if (isFormula) {
				sheet.setFormula(row, col, value as string);
			} else {
				sheet.setValue(row, col, resultValue);
			}
		});

		// 公式校验
		if (isFormula) {
			const text = sheet.getText(row, col);
			if (typeof text === "string" && /^#[A-Z/]+[!?]?$/.test(text)) {
				return {
					cell: `${colIndexToLetter(col)}${row + 1}`,
					formulaError: text,
				};
			}
		}

		return { cell: `${colIndexToLetter(col)}${row + 1}` };
	});
}
