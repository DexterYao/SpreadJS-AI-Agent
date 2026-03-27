import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, normalizeColor, safe } from "../internal";

const CellStatesType = GC.Spread.Sheets.CellStatesType;

const stateMap: Record<string, GC.Spread.Sheets.CellStatesType> = {
	hover: CellStatesType.hover,
	invalid: CellStatesType.invalid,
	readonly: CellStatesType.readonly,
	edit: CellStatesType.edit,
	active: CellStatesType.active,
	selected: CellStatesType.selected,
	dirty: CellStatesType.dirty,
	invalidFormula: CellStatesType.invalidFormula,
};

interface CellStateStyleInput {
	backColor?: string;
	foreColor?: string;
	fontFamily?: string;
	fontSize?: number;
	bold?: boolean;
	italic?: boolean;
}

function buildStyle(input: CellStateStyleInput): GC.Spread.Sheets.Style {
	const style = new GC.Spread.Sheets.Style();
	if (input.backColor) style.backColor = normalizeColor(input.backColor);
	if (input.foreColor) style.foreColor = normalizeColor(input.foreColor);
	if (input.fontFamily) style.font = input.fontFamily;
	if (input.fontSize) style.font = `${input.fontSize}pt ${input.fontFamily ?? "Calibri"}`;
	if (input.bold !== undefined) style.fontWeight = input.bold ? "bold" : "normal";
	if (input.italic !== undefined) style.fontStyle = input.italic ? "italic" : "normal";
	return style;
}

export interface AddCellStateInput {
	row: number;
	col: number;
	rowCount: number;
	colCount: number;
	stateType: string;
	style: CellStateStyleInput;
}

/** 为指定范围添加单元格状态样式 */
export function addCellState(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	input: AddCellStateInput,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const stateEnum = stateMap[input.stateType];
		if (stateEnum === undefined) {
			throw new Error(`未知的状态类型: ${input.stateType}。可选: ${Object.keys(stateMap).join(", ")}`);
		}
		const range = new GC.Spread.Sheets.Range(input.row, input.col, input.rowCount, input.colCount);
		const style = buildStyle(input.style);
		sheet.cellStates.add(range, stateEnum, style);
		return {
			stateType: input.stateType,
			appliedRange: { row: input.row, col: input.col, rowCount: input.rowCount, colCount: input.colCount },
		};
	});
}
