import type { SpreadWorkbook, SpreadWorksheet } from "@/lib/agent/types";
import { colIndexToLetter, parseRangeAddress } from "@/lib/spreadjs/utils";
import { getSheet, safe } from "../internal";

interface DependencyNode {
	cell: string;
	sheetName: string;
	value: unknown;
	formula: string | null;
	children: DependencyNode[];
}

export function traceDependencies(
	workbook: SpreadWorkbook,
	cell: string,
	direction: "precedents" | "dependents" | "both",
	maxDepth: number,
) {
	return safe(() => {
		const parsed = parseRangeAddress(cell);
		const sheet = getSheet(workbook, parsed.sheetName);
		const row = parsed.startRow;
		const col = parsed.startCol;

		const cellAddr = `${sheet.name()}!${colIndexToLetter(col)}${row + 1}`;

		const buildTree = (
			s: SpreadWorksheet,
			r: number,
			c: number,
			dir: "precedents" | "dependents",
			depth: number,
			visited: Set<string>,
		): DependencyNode[] => {
			if (depth >= maxDepth) return [];

			const refs = dir === "precedents"
				? s.getPrecedents(r, c)
				: s.getDependents(r, c);

			const nodes: DependencyNode[] = [];
			for (const ref of refs) {
				const refSheet = workbook.getSheetFromName(ref.sheetName) ?? s;
				const rowEnd = ref.row + (ref.rowCount ?? 1);
				const colEnd = ref.col + (ref.colCount ?? 1);
				for (let ri = ref.row; ri < rowEnd; ri++) {
					for (let ci = ref.col; ci < colEnd; ci++) {
						const key = `${ref.sheetName}!${ri}:${ci}`;
						if (visited.has(key)) continue;
						visited.add(key);

						const addr = `${ref.sheetName}!${colIndexToLetter(ci)}${ri + 1}`;
						const node: DependencyNode = {
							cell: addr,
							sheetName: ref.sheetName,
							value: refSheet.getValue(ri, ci),
							formula: refSheet.getFormula(ri, ci) || null,
							children: buildTree(refSheet, ri, ci, dir, depth + 1, visited),
						};
						nodes.push(node);
					}
				}
			}
			return nodes;
		};

		const result: Record<string, unknown> = {
			cell: cellAddr,
			value: sheet.getValue(row, col),
			formula: sheet.getFormula(row, col) || null,
		};

		if (direction === "precedents" || direction === "both") {
			result.precedents = buildTree(sheet, row, col, "precedents", 0, new Set([`${sheet.name()}!${row}:${col}`]));
		}
		if (direction === "dependents" || direction === "both") {
			result.dependents = buildTree(sheet, row, col, "dependents", 0, new Set([`${sheet.name()}!${row}:${col}`]));
		}

		return result;
	});
}
