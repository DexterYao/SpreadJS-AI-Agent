import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { colIndexToLetter } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageTable: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_table",
	displayName: "管理表格",
	module: "table",
	description:
		"进入表格操作模式。调用后可使用表格相关子工具（创建、删除、设置样式等）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		const tables: Array<{ name: string; range: string; theme: string }> = [];
		try {
			const allTables = sheet.tables.all();
			for (const t of allTables) {
				const r = t.range();
				const start = `${colIndexToLetter(r.col)}${r.row + 1}`;
				const endCol = r.col + r.colCount - 1;
				const endRow = r.row + r.rowCount - 1;
				const rangeStr = `${start}:${colIndexToLetter(endCol)}${endRow + 1}`;
				tables.push({
					name: t.name(),
					range: rangeStr,
					theme: t.getStyleName?.() ?? "unknown",
				});
			}
		} catch (e) {
			console.warn("[manage_table]", e);
		}

		return {
			success: true,
			data: {
				module: "table",
				activeSheet: sheetName,
				currentTables: tables,
				availableActions: [
					"add_table — 创建表格",
					"remove_table — 删除表格（默认保留数据）",
					"set_table_style — 修改主题（不要 remove 再 add，会丢数据）",
					"set_table_option — 设置选项（表头行、汇总行、筛选等）",
					"get_table_info — 获取表格详细信息",
				],
			},
		};
	},
};

export default manageTable;
