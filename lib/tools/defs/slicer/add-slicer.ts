import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("切片器名称，如 slicer1"),
	targetName: z.string().describe("关联的表格名或透视表名"),
	columnName: z.string().describe("关联的列名（表格列名或透视表字段名）"),
	type: z
		.enum(["table", "pivotTable", "pivotTimeline"])
		.optional()
		.describe(
			"切片器类型，默认 table。" +
			"table：仅用于 Table（表格），targetName 必须是表格名。" +
			"pivotTable：仅用于 PivotTable（透视表），targetName 必须是透视表名。" +
			"pivotTimeline：仅用于透视表的日期类型字段，columnName 必须指向日期字段，否则会报错。",
		),
	x: z.number().optional().describe("水平位置（像素）"),
	y: z.number().optional().describe("垂直位置（像素）"),
	width: z.number().optional().describe("宽度（像素）"),
	height: z.number().optional().describe("高度（像素）"),
	style: z
		.string()
		.optional()
		.describe(
			"内置样式名。table/pivotTable 用 SlicerStyles: light1-6、dark1-6、other1-2；" +
			"pivotTimeline 用 TimelineStyles: light1-6、dark1-6",
		),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const addSlicer: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_slicer",
	displayName: "创建切片器",
	module: "slicer",
	description:
		"创建切片器（表格切片器 / 透视表项目切片器 / 透视表时间线切片器）。" +
		"\n⚠️ 类型约束：table 类型的 targetName 必须是已有的 Table 名称；pivotTable/pivotTimeline 的 targetName 必须是已有的 PivotTable 名称。" +
		"pivotTimeline 的 columnName 必须指向日期类型字段，非日期字段会导致创建失败。" +
		"\n示例：name='slicer1', targetName='Table1', columnName='City', type='table'",
	inputSchema,
	handler: async (workbook, input) => {
		const { addSlicer: bridge } = await import("@/lib/spreadjs/bridge/slicer");
		return bridge(workbook, input);
	},
};

export default addSlicer;
