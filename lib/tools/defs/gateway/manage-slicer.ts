import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageSlicer: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_slicer",
	displayName: "管理切片器",
	module: "slicer",
	description:
		"进入切片器操作模式。创建配合表格/透视表的交互筛选切片器。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		const slicers: Array<{ name: string; sourceName: string }> = [];
		try {
			const all = sheet.slicers.all();
			for (const s of all) {
				slicers.push({
					name: s.name() as string,
					sourceName: s.sourceName(),
				});
			}
		} catch (e) {
			console.warn("[manage_slicer]", e);
		}

		return {
			success: true,
			data: {
				module: "slicer",
				activeSheet: sheetName,
				currentSlicers: slicers,
				availableActions: [
					"add_slicer — 创建切片器（需先有表格/透视表）",
					"modify_slicer — 修改切片器属性（位置、大小、样式、标题）",
					"remove_slicer — 移除切片器",
				],
			},
		};
	},
};

export default manageSlicer;
