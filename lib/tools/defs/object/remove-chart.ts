import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	chartName: z.string().describe("要删除的图表名称（通过 get_all_objects 获取）"),
	sheetName: z.string().optional().describe("图表所在工作表，省略则为活动工作表"),
});

const removeChart: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_chart",
	displayName: "删除图表",
	module: "chart",
	description:
		"从工作表中删除指定图表。先用 get_all_objects 获取图表名称。删除操作不可逆。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.removeChart(workbook, input.chartName, input.sheetName);
	},
};

export default removeChart;
