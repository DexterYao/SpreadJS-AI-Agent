import type GC from "@grapecity-software/spread-sheets";

export type SpreadWorkbook = GC.Spread.Sheets.Workbook;
export type SpreadWorksheet = GC.Spread.Sheets.Worksheet;

/** 工具执行统一返回结构 */
export interface ToolResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

/** 工作表元信息 */
export interface SheetMeta {
	name: string;
	index: number;
	rowCount: number;
	colCount: number;
	usedRange: {
		row: number;
		col: number;
		rowCount: number;
		colCount: number;
	} | null;
	isActive: boolean;
}

/** 工作簿元信息 */
export interface WorkbookMeta {
	sheetCount: number;
	activeSheetIndex: number;
	sheets: SheetMeta[];
}

/** 单元格数据 */
export interface CellData {
	row: number;
	col: number;
	value: unknown;
	formula: string | null;
	formattedText: string;
}

/** 已解析的范围 */
export interface ResolvedRange {
	sheetName?: string;
	row: number;
	col: number;
	rowCount: number;
	colCount: number;
}

/** 格式定义（属性名对齐 SpreadJS Style 分离属性 API） */
export interface FormatSpec {
	fontFamily?: string;
	fontSize?: number;
	bold?: boolean;
	italic?: boolean;
	foreColor?: string;
	backColor?: string;
	hAlign?: "left" | "center" | "right";
	vAlign?: "top" | "center" | "bottom";
	formatter?: string;
	wordWrap?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
}
