import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

interface CellStateInfo {
	row: number;
	col: number;
	rowCount: number;
	colCount: number;
	stateType: string;
	style: Record<string, unknown>;
}

/**
 * 获取指定 sheet 的单元格状态配置。
 * SpreadJS CellStateManager 没有直接的 get 方法，
 * 通过 sheet.toJSON() 提取 cellStates 字段获取已配置的状态信息。
 */
export function getCellStates(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const json = sheet.toJSON() as any;
		const cellStatesData = json?.cellStates;
		if (!cellStatesData || (Array.isArray(cellStatesData) && cellStatesData.length === 0)) {
			return { count: 0, cellStates: [] as CellStateInfo[] };
		}

		// cellStates 在 JSON 中的格式因版本而异，直接返回原始结构供 AI 解读
		const states: CellStateInfo[] = [];
		if (Array.isArray(cellStatesData)) {
			for (const item of cellStatesData) {
				states.push({
					row: item.range?.row ?? item.row ?? 0,
					col: item.range?.col ?? item.col ?? 0,
					rowCount: item.range?.rowCount ?? item.rowCount ?? 1,
					colCount: item.range?.colCount ?? item.colCount ?? 1,
					stateType: resolveStateName(item.state ?? item.stateType),
					style: item.style ?? {},
				});
			}
		} else if (typeof cellStatesData === "object") {
			// 部分版本可能是对象结构
			states.push({ row: 0, col: 0, rowCount: 0, colCount: 0, stateType: "raw", style: cellStatesData });
		}

		return { count: states.length, cellStates: states };
	});
}

const stateNames: Record<number, string> = {
	1: "hover",
	2: "invalid",
	4: "readonly",
	8: "edit",
	16: "active",
	32: "selected",
	64: "dirty",
	128: "invalidFormula",
};

function resolveStateName(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number") return stateNames[value] ?? `unknown(${value})`;
	return String(value);
}
