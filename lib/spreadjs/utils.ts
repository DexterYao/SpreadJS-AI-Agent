import type { ResolvedRange } from "@/lib/agent/types";

/** 列字母转0索引: "A"->0, "Z"->25, "AA"->26 */
export function colLetterToIndex(letters: string): number {
	let result = 0;
	for (let i = 0; i < letters.length; i++) {
		result = result * 26 + (letters.charCodeAt(i) - 64);
	}
	return result - 1;
}

/** 0索引转列字母: 0->"A", 25->"Z", 26->"AA" */
export function colIndexToLetter(index: number): string {
	let result = "";
	let n = index + 1;
	while (n > 0) {
		n--;
		result = String.fromCharCode(65 + (n % 26)) + result;
		n = Math.floor(n / 26);
	}
	return result;
}

interface ParsedAddress {
	sheetName?: string;
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
}

const CELL_RE = /^([A-Z]+)(\d+)$/;

function parseCell(cell: string): { row: number; col: number } {
	const m = cell.match(CELL_RE);
	if (!m) throw new Error(`无效的单元格地址: ${cell}`);
	return {
		row: parseInt(m[2], 10) - 1,
		col: colLetterToIndex(m[1]),
	};
}

/**
 * 解析范围地址 "Sheet1!A1:B5" 或 "A1:B5" 或 "A1"
 */
export function parseRangeAddress(address: string): ParsedAddress {
	let sheetName: string | undefined;
	let rangePart = address;

	const bangIdx = address.indexOf("!");
	if (bangIdx !== -1) {
		sheetName = address.substring(0, bangIdx).replace(/^'|'$/g, "");
		rangePart = address.substring(bangIdx + 1);
	}

	const parts = rangePart.split(":");
	const start = parseCell(parts[0]);

	if (parts.length === 1) {
		return { sheetName, startRow: start.row, startCol: start.col, endRow: start.row, endCol: start.col };
	}

	const end = parseCell(parts[1]);
	return { sheetName, startRow: start.row, startCol: start.col, endRow: end.row, endCol: end.col };
}

/**
 * 将范围地址字符串解析为 ResolvedRange（单个范围）。
 * 若地址含逗号（多区域），仅取第一个子区域。多区域场景请用 resolveAddresses。
 */
export function resolveAddress(address: string): ResolvedRange {
	const first = address.includes(",") ? splitMultiRange(address)[0] : address;
	const parsed = parseRangeAddress(first);
	return {
		sheetName: parsed.sheetName,
		row: parsed.startRow,
		col: parsed.startCol,
		rowCount: parsed.endRow - parsed.startRow + 1,
		colCount: parsed.endCol - parsed.startCol + 1,
	};
}

/**
 * 将可能包含逗号的多区域地址字符串解析为 ResolvedRange 数组。
 * 支持 "A1:B5"、"Sheet1!A1:B5,C1:D5"、"A4:A8,A10:A17,A19:E19" 等格式。
 */
export function resolveAddresses(address: string): ResolvedRange[] {
	const parts = splitMultiRange(address);
	return parts.map((part) => {
		const parsed = parseRangeAddress(part);
		return {
			sheetName: parsed.sheetName,
			row: parsed.startRow,
			col: parsed.startCol,
			rowCount: parsed.endRow - parsed.startRow + 1,
			colCount: parsed.endCol - parsed.startCol + 1,
		};
	});
}

/**
 * 将 "Sheet1!A4:A8,A10:A17,A19:E19" 拆分为各子范围字符串。
 * sheetName 前缀会自动继承到后续无前缀的子范围。
 */
export function splitMultiRange(address: string): string[] {
	let sheetPrefix = "";
	const bangIdx = address.indexOf("!");
	if (bangIdx !== -1) {
		sheetPrefix = address.substring(0, bangIdx + 1);
	}

	const rangePart = bangIdx !== -1 ? address.substring(bangIdx + 1) : address;
	return rangePart.split(",").map((seg) => {
		const trimmed = seg.trim();
		return trimmed.includes("!") ? trimmed : sheetPrefix + trimmed;
	});
}

/** ResolvedRange 转 "A1:B5" 字符串 */
export function toRangeAddress(range: ResolvedRange): string {
	const start = `${colIndexToLetter(range.col)}${range.row + 1}`;
	const endRow = range.row + range.rowCount - 1;
	const endCol = range.col + range.colCount - 1;
	if (range.rowCount === 1 && range.colCount === 1) return start;
	return `${start}:${colIndexToLetter(endCol)}${endRow + 1}`;
}
