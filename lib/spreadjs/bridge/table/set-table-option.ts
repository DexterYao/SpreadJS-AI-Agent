import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function setTableOption(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		showHeader?: boolean;
		showFooter?: boolean;
		showFilter?: boolean;
		bandRows?: boolean;
		bandColumns?: boolean;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const table = sheet.tables.findByName(input.name);
		if (!table) throw new Error(`表格 "${input.name}" 不存在`);

		if (input.showHeader !== undefined) table.showHeader(input.showHeader);
		if (input.showFooter !== undefined) table.showFooter(input.showFooter);
		if (input.bandRows !== undefined) table.bandRows(input.bandRows);
		if (input.bandColumns !== undefined) table.bandColumns(input.bandColumns);

		if (input.showFilter !== undefined) {
			// filterButtonVisible 无参数时 get，有参数时 set 所有列
			const range = table.range();
			for (let c = 0; c < range.colCount; c++) {
				table.filterButtonVisible(c, input.showFilter);
			}
		}

		return {
			table: input.name,
			showHeader: table.showHeader(),
			showFooter: table.showFooter(),
			bandRows: table.bandRows(),
			bandColumns: table.bandColumns(),
		};
	});
}
