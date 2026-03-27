import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageConditionalFormatting: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_conditional_formatting",
	displayName: "管理条件格式",
	module: "conditional_formatting",
	description:
		"进入条件格式操作模式。调用后可使用条件格式相关子工具（高亮规则、色阶、数据条、图标集等）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();
		const cfCount = sheet.conditionalFormats?.count?.() ?? 0;
		return {
			success: true,
			data: {
				module: "conditional_formatting",
				activeSheet: sheetName,
				existingRuleCount: cfCount,
				availableActions: [
					"add_highlight_rule — 值比较/Top N/重复值/文本匹配高亮",
					"add_color_scale — 渐变色阶（2色/3色）",
					"add_data_bar — 数据条进度效果",
					"add_icon_set — 图标分级显示",
				],
			},
		};
	},
};

export default manageConditionalFormatting;
