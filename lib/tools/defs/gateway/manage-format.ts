import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageFormat: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_format",
	displayName: "管理格式",
	module: "format",
	description:
		"进入格式操作模式。调用后可使用格式相关子工具（设置字体/颜色/对齐/数字格式、合并单元格、查看格式等）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();
		return {
			success: true,
			data: {
				module: "format",
				activeSheet: sheetName,
				availableActions: [
					"format_range — 设置字体、颜色、对齐、数字格式、边框等",
					"merge_cells — 合并/取消合并单元格",
					"get_cell_format — 获取单元格详细格式信息",
				],
			},
		};
	},
};

export default manageFormat;
