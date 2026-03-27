import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageChart: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_chart",
	displayName: "管理图表",
	module: "chart",
	description:
		"进入图表操作模式。调用后可使用图表相关子工具（创建、修改、删除图表，查看所有浮动对象）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		// 获取当前 sheet 上的图表
		const charts: Array<{ name: string; chartType: number }> = [];
		try {
			const chartArr = sheet.charts?.all?.() ?? [];
			for (const c of chartArr) {
				charts.push({
					name: c.name?.() ?? "unknown",
					chartType: c.chartType?.() ?? -1,
				});
			}
		} catch (e) {
			console.warn("[manage_chart]", e);
		}

		return {
			success: true,
			data: {
				module: "chart",
				activeSheet: sheetName,
				currentCharts: charts,
				availableActions: [
					"add_chart — 创建新图表（柱状图、折线图、饼图等12种）",
					"modify_chart — 修改已有图表属性（标题、数据源、大小等）",
					"remove_chart — 删除图表",
					"get_all_objects — 获取所有浮动对象（图表+透视表）的元信息",
				],
			},
		};
	},
};

export default manageChart;
