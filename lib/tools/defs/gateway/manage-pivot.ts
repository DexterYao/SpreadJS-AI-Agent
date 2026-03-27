import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const managePivot: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_pivot",
	displayName: "管理透视表",
	module: "pivot",
	description:
		"进入透视表操作模式。调用后可使用透视表相关子工具（创建、修改、删除透视表）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		// 获取当前 sheet 上的透视表
		const pivots: Array<{ name: string }> = [];
		try {
			const pivotArr = sheet.pivotTables?.all?.() ?? [];
			for (const p of pivotArr) {
				pivots.push({
					name: p.name?.() ?? "unknown",
				});
			}
		} catch (e) {
			console.warn("[manage_pivot]", e);
		}

		return {
			success: true,
			data: {
				module: "pivot",
				activeSheet: sheetName,
				currentPivotTables: pivots,
				availableActions: [
					"add_pivot_table — 创建透视表",
					"modify_pivot_table — 修改透视表字段配置",
					"remove_pivot_table — 删除透视表",
				],
			},
		};
	},
};

export default managePivot;
