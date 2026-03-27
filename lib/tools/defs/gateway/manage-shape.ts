import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageShape: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_shape",
	displayName: "管理形状",
	module: "shape",
	description:
		"进入形状操作模式。创建、修改、删除形状和浮动对象，插入图片。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		const shapes: Array<{ name: string; x: number; y: number; width: number; height: number }> = [];
		try {
			for (const s of sheet.shapes.all()) {
				shapes.push({
					name: s.name(),
					x: s.x(),
					y: s.y(),
					width: s.width(),
					height: s.height(),
				});
			}
		} catch (e) {
			console.warn("[manage_shape]", e);
		}

		return {
			success: true,
			data: {
				module: "shape",
				activeSheet: sheetName,
				currentShapes: shapes,
				availableActions: [
					"add_shape — 创建形状（矩形、圆形、三角形、箭头、星形等）",
					"modify_shape — 修改形状位置、尺寸、颜色",
					"remove_shape — 删除形状或图片",
					"add_image — 插入图片（URL）",
					"add_picture — 插入图片（base64）",
				],
			},
		};
	},
};

export default manageShape;
