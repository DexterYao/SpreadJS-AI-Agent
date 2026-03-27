import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const shapeTypes = [
	"rectangle", "roundedRectangle", "oval", "diamond",
	"triangle", "rightTriangle", "parallelogram", "trapezoid",
	"pentagon", "hexagon", "octagon", "heart", "donut",
	"shape4pointStar", "shape5pointStar", "shape8pointStar",
	"rightArrow", "leftArrow", "upArrow", "downArrow",
	"cloud", "lightningBolt", "smileyFace", "moon", "sun",
] as const;

const inputSchema = z.object({
	name: z.string().describe("形状名称，如 Shape1"),
	type: z.enum(shapeTypes).describe("形状类型"),
	x: z.number().describe("左上角 X 坐标（像素）"),
	y: z.number().describe("左上角 Y 坐标（像素）"),
	width: z.number().describe("宽度（像素）"),
	height: z.number().describe("高度（像素）"),
	backColor: z.string().optional().describe("填充颜色，如 #FF0000 或 red"),
	borderColor: z.string().optional().describe("边框颜色"),
	borderWidth: z.number().optional().describe("边框宽度（像素）"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const addShape: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_shape",
	displayName: "创建形状",
	module: "shape",
	description:
		"在工作表中添加内置形状。支持矩形、圆形、三角形、箭头、星形、心形等 25 种常见形状。坐标和尺寸单位为像素。",
	inputSchema,
	handler: async (workbook, input) => {
		const { addShape: bridge } = await import("@/lib/spreadjs/bridge/shape");
		return bridge(workbook, input);
	},
};

export default addShape;
