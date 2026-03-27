import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageCellState: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_cell_state",
	displayName: "管理单元格状态",
	module: "cell_state",
	description:
		"进入单元格状态操作模式。设置 hover/active/dirty 等交互状态样式，用于仪表板和表单。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		return {
			success: true,
			data: {
				module: "cell_state",
				activeSheet: sheetName,
				availableActions: [
					"add_cell_state — 添加单元格状态样式",
					"remove_cell_state — 移除状态样式",
					"get_cell_states — 获取状态配置",
				],
			},
		};
	},
};

export default manageCellState;
