import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

const CriteriaType = GC.Spread.Sheets.DataValidation.CriteriaType;
const SheetArea = GC.Spread.Sheets.SheetArea;

const criteriaNames: Record<number, string> = {
	[CriteriaType.anyValue]: "anyValue",
	[CriteriaType.wholeNumber]: "wholeNumber",
	[CriteriaType.decimalValues]: "decimalValues",
	[CriteriaType.list]: "list",
	[CriteriaType.date]: "date",
	[CriteriaType.time]: "time",
	[CriteriaType.textLength]: "textLength",
	[CriteriaType.custom]: "custom",
};

interface ValidationInfo {
	row: number;
	col: number;
	type: string;
	value1?: unknown;
	value2?: unknown;
	validList?: unknown[];
	inputTitle?: string;
	inputMessage?: string;
	errorTitle?: string;
	errorMessage?: string;
}

/** 获取指定区域内每个有验证器的单元格的验证规则信息 */
export function getValidation(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row: number,
	col: number,
	rowCount: number,
	colCount: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const results: ValidationInfo[] = [];
		// 避免重复：同一验证器可能覆盖多个单元格，记录已处理的首次坐标
		const seen = new Set<string>();

		for (let r = row; r < row + rowCount; r++) {
			for (let c = col; c < col + colCount; c++) {
				const dv = sheet.getDataValidator(r, c, SheetArea.viewport);
				if (!dv) continue;

				const key = `${r},${c}`;
				if (seen.has(key)) continue;
				seen.add(key);

				const typeVal = dv.type?.();
				const info: ValidationInfo = {
					row: r,
					col: c,
					type: criteriaNames[typeVal] ?? `unknown(${typeVal})`,
				};

				try { info.value1 = dv.value1?.(); } catch { /* 部分类型无 value1 */ }
				try { info.value2 = dv.value2?.(); } catch { /* 部分类型无 value2 */ }

				// 列表类型获取有效列表
				if (typeVal === CriteriaType.list) {
					try { info.validList = dv.getValidList?.(sheet, r, c); } catch { /* 忽略 */ }
				}

				try {
					const title = dv.inputTitle?.();
					if (title) info.inputTitle = title;
				} catch { /* 忽略 */ }
				try {
					const msg = dv.inputMessage?.();
					if (msg) info.inputMessage = msg;
				} catch { /* 忽略 */ }
				try {
					const title = dv.errorTitle?.();
					if (title) info.errorTitle = title;
				} catch { /* 忽略 */ }
				try {
					const msg = dv.errorMessage?.();
					if (msg) info.errorMessage = msg;
				} catch { /* 忽略 */ }

				results.push(info);
			}
		}

		return { count: results.length, validators: results };
	});
}
