import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

const CT = GC.Spread.Sheets.CellTypes;

interface CellTypeInfo {
	row: number;
	col: number;
	type: string;
	properties: Record<string, unknown>;
}

function identifyCellType(ct: InstanceType<typeof CT.Base>): { type: string; properties: Record<string, unknown> } {
	if (ct instanceof CT.CheckBox) {
		return {
			type: "checkbox",
			properties: {
				caption: ct.caption(),
				isThreeState: ct.isThreeState(),
				textTrue: ct.textTrue(),
				textFalse: ct.textFalse(),
			},
		};
	}
	if (ct instanceof CT.ComboBox) {
		return {
			type: "combobox",
			properties: {
				items: ct.items(),
				editorValueType: ct.editorValueType(),
			},
		};
	}
	if (ct instanceof CT.Button) {
		return {
			type: "button",
			properties: {
				text: ct.text(),
				buttonBackColor: ct.buttonBackColor(),
			},
		};
	}
	if (ct instanceof CT.HyperLink) {
		return {
			type: "hyperlink",
			properties: {
				linkColor: ct.linkColor(),
				visitedLinkColor: ct.visitedLinkColor(),
				linkToolTip: ct.linkToolTip(),
			},
		};
	}
	return { type: "unknown", properties: {} };
}

/** 获取指定区域内每个有自定义类型的单元格的类型信息 */
export function getCellType(
	workbook: SpreadWorkbook,
	sheetName: string | undefined,
	row: number,
	col: number,
	rowCount: number,
	colCount: number,
) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const results: CellTypeInfo[] = [];

		for (let r = row; r < row + rowCount; r++) {
			for (let c = col; c < col + colCount; c++) {
				const ct = sheet.getCellType(r, c);
				if (!ct || ct instanceof CT.Text) continue;

				const info = identifyCellType(ct);
				results.push({ row: r, col: c, ...info });
			}
		}

		return { count: results.length, cellTypes: results };
	});
}
