import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageValidation: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_validation",
	displayName: "管理数据验证",
	module: "validation",
	description:
		"进入数据验证操作模式。调用后可使用数据验证相关子工具（创建下拉列表、数字范围校验、日期校验等）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		return {
			success: true,
			data: {
				module: "validation",
				activeSheet: sheetName,
				availableActions: [
					"add_validation — 添加数据验证（下拉列表、数字范围、日期、文本长度、公式）",
					"remove_validation — 移除指定范围的数据验证",
					"get_validation — 获取指定范围的验证规则详情",
				],
			},
		};
	},
};

export default manageValidation;
