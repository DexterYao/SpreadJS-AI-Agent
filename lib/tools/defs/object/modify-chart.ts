import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	chartName: z.string().describe("要修改的图表名称（通过 get_all_objects 获取）"),
	sheetName: z.string().optional().describe("图表所在工作表，省略则为活动工作表"),
	title: z.string().optional().describe("新标题"),
	chartType: z.enum([
		"columnClustered", "columnStacked",
		"line", "lineMarkers", "lineStacked",
		"pie", "doughnut",
		"barClustered", "barStacked",
		"area", "areaStacked",
		"scatter",
	]).optional().describe("新图表类型"),
	width: z.number().optional().describe("新宽度（像素）"),
	height: z.number().optional().describe("新高度（像素）"),
	x: z.number().optional().describe("新 X 坐标（像素）"),
	y: z.number().optional().describe("新 Y 坐标（像素）"),
	dataRange: z.string().optional().describe("新数据源范围，如 'A1:D10'"),
});

const modifyChart: ToolDef<z.infer<typeof inputSchema>> = {
	name: "modify_chart",
	displayName: "修改图表",
	module: "chart",
	description:
		"修改已有图表的属性（标题、类型、尺寸、位置、数据源）。仅修改指定属性，未提供的保持不变。先用 get_all_objects 获取图表名称。不要用此工具创建图表 — 请用 add_chart。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.modifyChart(workbook, input);
	},
};

export default modifyChart;
