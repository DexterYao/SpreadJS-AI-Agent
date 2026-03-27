import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("切片器名称"),
	x: z.number().optional().describe("水平位置（像素）"),
	y: z.number().optional().describe("垂直位置（像素）"),
	width: z.number().optional().describe("宽度（像素）"),
	height: z.number().optional().describe("高度（像素）"),
	style: z.string().optional().describe("样式名称字符串"),
	caption: z.string().optional().describe("切片器标题文本"),
	// slicer 系（table + pivotTable）
	columnCount: z
		.number()
		.optional()
		.describe("一行显示的列数（仅 table/pivotTable 切片器）"),
	itemHeight: z
		.number()
		.optional()
		.describe("每项高度（仅 table/pivotTable 切片器）"),
	showNoDataItems: z
		.boolean()
		.optional()
		.describe("是否显示无数据项（仅 table/pivotTable 切片器）"),
	// pivot 系（pivotTable + pivotTimeline）
	connectPivotTable: z
		.string()
		.optional()
		.describe("连接到指定透视表名（仅 pivot 切片器，用于多表联动筛选）"),
	disconnectPivotTable: z
		.string()
		.optional()
		.describe("断开与指定透视表的连接（仅 pivot 切片器）"),
	// timeline 专属
	timelineLevel: z
		.enum(["years", "quarters", "months", "days"])
		.optional()
		.describe("时间粒度（仅 pivotTimeline 切片器）"),
	showTimeLevel: z
		.boolean()
		.optional()
		.describe("是否显示时间级别选择器（仅 pivotTimeline）"),
	showHorizontalScrollbar: z
		.boolean()
		.optional()
		.describe("是否显示水平滚动条（仅 pivotTimeline）"),
	showSelectionLabel: z
		.boolean()
		.optional()
		.describe("是否显示选择标签（仅 pivotTimeline）"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const modifySlicer: ToolDef<z.infer<typeof inputSchema>> = {
	name: "modify_slicer",
	displayName: "修改切片器",
	module: "slicer",
	description:
		"修改已有切片器的属性。至少提供一个可选属性。" +
		"\n通用属性：position、size、style、caption。" +
		"\ntable/pivotTable 切片器：columnCount、itemHeight、showNoDataItems。" +
		"\npivot 切片器：connectPivotTable、disconnectPivotTable（多表联动）。" +
		"\npivotTimeline 切片器：timelineLevel、showTimeLevel、showHorizontalScrollbar、showSelectionLabel。" +
		"\n⚠️ 对不支持的切片器类型传入专属属性会被静默忽略。",
	inputSchema,
	handler: async (workbook, input) => {
		const { modifySlicer: bridge } = await import("@/lib/spreadjs/bridge/slicer");
		return bridge(workbook, input);
	},
};

export default modifySlicer;
