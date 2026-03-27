import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageCellType: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_cell_type",
	displayName: "管理单元格类型",
	module: "cell_type",
	description:
		"进入单元格类型操作模式。设置 checkbox、button、combobox 等控件类型。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		return {
			success: true,
			data: {
				module: "cell_type",
				activeSheet: sheetName,
				availableActions: [
					"set_cell_type — 设置单元格类型（checkbox/button/combobox等）",
					"remove_cell_type — 移除单元格类型",
					"get_cell_type — 获取类型信息",
				],
			},
		};
	},
};

export default manageCellType;
