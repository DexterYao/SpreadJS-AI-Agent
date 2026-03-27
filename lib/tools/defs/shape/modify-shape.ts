import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要修改的形状名称"),
	x: z.number().optional().describe("新的 X 坐标（像素）"),
	y: z.number().optional().describe("新的 Y 坐标（像素）"),
	width: z.number().optional().describe("新的宽度（像素）"),
	height: z.number().optional().describe("新的高度（像素）"),
	backColor: z.string().optional().describe("新的填充颜色"),
	borderColor: z.string().optional().describe("新的边框颜色"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const modifyShape: ToolDef<z.infer<typeof inputSchema>> = {
	name: "modify_shape",
	displayName: "修改形状",
	module: "shape",
	description:
		"修改已有形状的位置、尺寸或样式。仅传需要修改的属性，未传的属性保持不变。",
	inputSchema,
	handler: async (workbook, input) => {
		const { modifyShape: bridge } = await import("@/lib/spreadjs/bridge/shape");
		return bridge(workbook, input);
	},
};

export default modifyShape;
