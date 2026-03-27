import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("图片名称，如 Picture1"),
	fileName: z.string().optional().describe("已上传图片的文件名（如 photo.jpg）。填写后系统自动注入图片数据，无需填写 base64"),
	base64: z.string().optional().describe("base64 编码的图片数据（可含 data:image/... 前缀，也可纯 base64）。已上传的图片请用 fileName 参数代替"),
	x: z.number().optional().default(50).describe("左上角 X 坐标（像素），默认 50"),
	y: z.number().optional().default(50).describe("左上角 Y 坐标（像素），默认 50"),
	width: z.number().optional().default(200).describe("宽度（像素），默认 200"),
	height: z.number().optional().default(200).describe("高度（像素），默认 200"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const addPicture: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_picture",
	displayName: "插入图片(Base64)",
	module: "shape",
	description:
		"在工作表中插入图片形状。" +
		"插入用户已上传的图片时：提供 fileName（图片文件名），系统自动注入图片数据，无需填写 base64。" +
		"插入其他 base64 图片时：提供 base64 参数。" +
		"纯 base64 字符串自动补全 data:image/png;base64, 前缀。",
	inputSchema,
	handler: async (workbook, input) => {
		const { addPicture: bridge } = await import("@/lib/spreadjs/bridge/shape");
		return bridge(workbook, input);
	},
};

export default addPicture;
