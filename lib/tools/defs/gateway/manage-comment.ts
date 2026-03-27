import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageComment: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_comment",
	displayName: "管理批注",
	module: "comment",
	description:
		"进入批注操作模式。调用后可使用批注相关子工具（添加、编辑、删除、查看批注）。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		return {
			success: true,
			data: {
				module: "comment",
				activeSheet: sheetName,
				availableActions: [
					"add_comment — 添加批注",
					"edit_comment — 编辑批注内容",
					"remove_comment — 删除批注",
					"get_comments — 获取批注列表",
				],
			},
		};
	},
};

export default manageComment;
