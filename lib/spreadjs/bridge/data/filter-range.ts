import type { SpreadWorkbook, ResolvedRange } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, safe } from "../internal";

interface FilterSpec {
	column: number;
	values?: string[];
	condition?: {
		type: string;
		value: string | number;
		value2?: string | number;
	};
}

export function filterRange(
	workbook: SpreadWorkbook,
	range: ResolvedRange,
	filters: FilterSpec[],
	action: string,
	isTable: boolean,
	tableName?: string,
) {
	return safe(() => {
		const sheet = getSheet(workbook, range.sheetName);

		// table 模式：通过表格名称找到 Table 对象，使用其 rowFilter
		if (tableName) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const table = (sheet.tables as any).findByName(tableName);
			if (!table) throw new Error(`表格 "${tableName}" 不存在`);

			if (action === "clear") {
				const existing = table.rowFilter();
				if (existing) {
					existing.reset();
					table.rowFilter(null as unknown as GC.Spread.Sheets.Filter.RowFilterBase);
				}
				sheet.repaint();
				return { cleared: true };
			}

			const tableRange = table.range();
			const tableStartCol: number = tableRange.col;
			let tableRowFilter = table.rowFilter() as GC.Spread.Sheets.Filter.HideRowFilter | null;
			if (!tableRowFilter) {
				const gcRange = new GC.Spread.Sheets.Range(
					tableRange.row, tableRange.col, tableRange.rowCount, tableRange.colCount,
				);
				tableRowFilter = new GC.Spread.Sheets.Filter.HideRowFilter(gcRange);
				table.rowFilter(tableRowFilter);
			}

			applyFilters(tableRowFilter, filters, tableStartCol);
			sheet.repaint();
			return { filterCount: filters.length, table: tableName };
		}

		if (action === "clear") {
			const existing = sheet.rowFilter();
			if (existing) {
				existing.reset();
				sheet.rowFilter(null as unknown as GC.Spread.Sheets.Filter.RowFilterBase);
			}
			sheet.repaint();
			return { cleared: true };
		}

		const gcRange = new GC.Spread.Sheets.Range(
			range.row, range.col, range.rowCount, range.colCount,
		);
		const rowFilter = new GC.Spread.Sheets.Filter.HideRowFilter(gcRange);
		sheet.rowFilter(rowFilter);

		applyFilters(rowFilter, filters, range.col);
		sheet.repaint();
		return { filterCount: filters.length };
	});
}

function applyFilters(
	rowFilter: GC.Spread.Sheets.Filter.HideRowFilter,
	filters: FilterSpec[],
	startCol: number,
) {
	const CF = GC.Spread.Sheets.ConditionalFormatting;

	for (const f of filters) {
		const absCol = startCol + f.column;

		if (f.values && f.values.length > 0) {
			const conditions = f.values.map((v) =>
				new CF.Condition(CF.ConditionType.textCondition, {
					compareType: CF.TextCompareType.equalsTo,
					expected: String(v),
				}),
			);
			rowFilter.addFilterItem(absCol, conditions);
		} else if (f.condition) {
			let cond: GC.Spread.Sheets.ConditionalFormatting.Condition;
			const val = f.condition.value;
			const Ops = CF.GeneralComparisonOperators;

			switch (f.condition.type) {
				case "greaterThan":
					cond = new CF.Condition(CF.ConditionType.cellValueCondition, {
						compareType: Ops.greaterThan,
						expected: Number(val),
					});
					break;
				case "lessThan":
					cond = new CF.Condition(CF.ConditionType.cellValueCondition, {
						compareType: Ops.lessThan,
						expected: Number(val),
					});
					break;
				case "equals":
					cond = new CF.Condition(CF.ConditionType.cellValueCondition, {
						compareType: Ops.equalsTo,
						expected: val,
					});
					break;
				case "contains":
					cond = new CF.Condition(CF.ConditionType.textCondition, {
						compareType: CF.TextCompareType.contains,
						expected: String(val),
					});
					break;
				case "between": {
					// between 用两个条件组合
					const cond1 = new CF.Condition(CF.ConditionType.cellValueCondition, {
						compareType: Ops.greaterThanOrEqualsTo,
						expected: Number(val),
					});
					const cond2 = new CF.Condition(CF.ConditionType.cellValueCondition, {
						compareType: Ops.lessThanOrEqualsTo,
						expected: Number(f.condition.value2),
					});
					rowFilter.addFilterItem(absCol, [cond1, cond2]);
					rowFilter.filter(absCol);
					continue;
				}
				default:
					throw new Error(`未知筛选条件类型: ${f.condition.type}`);
			}
			rowFilter.addFilterItem(absCol, cond);
		}
		rowFilter.filter(absCol);
	}
}
