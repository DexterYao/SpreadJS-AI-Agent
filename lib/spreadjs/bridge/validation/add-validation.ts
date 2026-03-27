import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

const DV = GC.Spread.Sheets.DataValidation;
const CompOps = GC.Spread.Sheets.ConditionalFormatting.ComparisonOperators;

const operatorMap: Record<string, number> = {
	between: CompOps.between,
	notBetween: CompOps.notBetween,
	equalTo: CompOps.equalsTo,
	notEqualTo: CompOps.notEqualsTo,
	greaterThan: CompOps.greaterThan,
	greaterThanOrEqualTo: CompOps.greaterThanOrEqualsTo,
	lessThan: CompOps.lessThan,
	lessThanOrEqualTo: CompOps.lessThanOrEqualsTo,
};

interface ValidationInput {
	row: number;
	col: number;
	rowCount: number;
	colCount: number;
	type: string;
	// list
	source?: string;
	// number / date / textLength
	operator?: string;
	value1?: number | string;
	value2?: number | string;
	// number 专用
	integerOnly?: boolean;
	// formula
	formula?: string;
	// 提示信息
	inputTitle?: string;
	inputMessage?: string;
	errorTitle?: string;
	errorMessage?: string;
}

function resolveOperator(name?: string): number {
	if (!name) throw new Error("缺少 operator 参数");
	const op = operatorMap[name];
	if (op === undefined) throw new Error(`未知的比较运算符: ${name}。可选: ${Object.keys(operatorMap).join(", ")}`);
	return op;
}

export function addValidation(workbook: SpreadWorkbook, sheetName: string | undefined, input: ValidationInput) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		let dv;

		switch (input.type) {
			case "list":
				if (!input.source) throw new Error("list 类型需要 source 参数");
				// 以 = 开头视为公式列表引用（如 =$A$1:$A$5）
				dv = input.source.startsWith("=")
					? DV.createFormulaListValidator(input.source.substring(1))
					: DV.createListValidator(input.source);
				break;

			case "number":
				dv = DV.createNumberValidator(
					resolveOperator(input.operator),
					input.value1!, // number/date/textLength 类型必填
					input.value2!, // between/notBetween 时必填
					input.integerOnly ?? false,
				);
				break;

			case "date":
				dv = DV.createDateValidator(
					resolveOperator(input.operator),
					input.value1!,
					input.value2!,
				);
				break;

			case "textLength":
				dv = DV.createTextLengthValidator(
					resolveOperator(input.operator),
					input.value1!,
					input.value2!,
				);
				break;

			case "formula":
				if (!input.formula) throw new Error("formula 类型需要 formula 参数");
				dv = DV.createFormulaValidator(input.formula);
				break;

			default:
				throw new Error(`未知的验证类型: ${input.type}。可选: list, number, date, textLength, formula`);
		}

		// 设置提示信息
		if (input.inputTitle || input.inputMessage) {
			dv.showInputMessage(true);
			if (input.inputTitle) dv.inputTitle(input.inputTitle);
			if (input.inputMessage) dv.inputMessage(input.inputMessage);
		}
		if (input.errorTitle || input.errorMessage) {
			dv.showErrorMessage(true);
			if (input.errorTitle) dv.errorTitle(input.errorTitle);
			if (input.errorMessage) dv.errorMessage(input.errorMessage);
		}

		sheet.setDataValidator(input.row, input.col, input.rowCount, input.colCount, dv);

		return {
			type: input.type,
			appliedRange: { row: input.row, col: input.col, rowCount: input.rowCount, colCount: input.colCount },
		};
	});
}
