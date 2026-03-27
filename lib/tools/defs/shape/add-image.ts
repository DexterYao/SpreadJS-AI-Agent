import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("图片名称，如 Image1"),
	url: z.string().describe("图片 URL 地址"),
	x: z.number().optional().default(50).describe("左上角 X 坐标（像素），默认 50"),
	y: z.number().optional().default(50).describe("左上角 Y 坐标（像素），默认 50"),
	width: z.number().optional().default(200).describe("宽度（像素），默认 200"),
	height: z.number().optional().default(200).describe("高度（像素），默认 200"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const addImage: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_image",
	displayName: "插入图片(URL)",
	module: "shape",
	description:
		"通过 URL 在工作表中插入图片形状。支持 png/jpg/svg 等格式。图片以形状方式添加，支持后续修改位置和尺寸。",
	inputSchema,
	handler: async (workbook, input) => {
		const { addImage: bridge } = await import("@/lib/spreadjs/bridge/shape");
		return bridge(workbook, input);
	},
};

export default addImage;
