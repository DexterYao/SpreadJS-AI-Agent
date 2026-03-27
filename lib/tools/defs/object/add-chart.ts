import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	dataRange: z.string().describe('数据源范围，A1 格式，如 "A1:D10" 或 "Sheet1!A1:D10"。首行/首列通常为标签'),
	chartType: z.enum([
		"columnClustered", "columnStacked",
		"line", "lineMarkers", "lineStacked",
		"pie", "doughnut",
		"barClustered", "barStacked",
		"area", "areaStacked",
		"scatter",
	]).describe("图表类型"),
	chartName: z.string().optional().describe("图表名称，省略则自动生成"),
	sheetName: z.string().optional().describe("图表所在工作表，省略则为活动工作表"),
	x: z.number().default(50).describe("图表左上角 X 坐标（像素）"),
	y: z.number().default(250).describe("图表左上角 Y 坐标（像素）"),
	width: z.number().default(480).describe("图表宽度（像素）"),
	height: z.number().default(300).describe("图表高度（像素）"),
	title: z.string().optional().describe("图表标题文本"),
});

const addChart: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_chart",
	displayName: "创建图表",
	module: "chart",
	description:
		"在指定工作表上创建图表。数据源 dataRange 应包含标签行/列。支持柱状图、折线图、饼图、条形图、面积图、散点图等 12 种类型。图表创建后在 SpreadJS 中可交互编辑。不要用此工具修改已有图表 — 本工具仅创建新图表。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.addChart(workbook, input);
	},
};

export default addChart;
