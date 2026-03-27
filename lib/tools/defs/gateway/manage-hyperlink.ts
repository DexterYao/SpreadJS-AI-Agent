import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const manageHyperlink: ToolDef<z.infer<typeof inputSchema>> = {
	name: "manage_hyperlink",
	displayName: "管理超链接",
	module: "hyperlink",
	description:
		"进入超链接操作模式。设置、删除、查看单元格超链接。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getSheet } = await import("@/lib/spreadjs/bridge/internal");
		const sheet = getSheet(workbook, input.sheetName);
		const sheetName = sheet.name();

		return {
			success: true,
			data: {
				module: "hyperlink",
				activeSheet: sheetName,
				availableActions: [
					"set_hyperlink — 设置超链接",
					"remove_hyperlink — 移除超链接",
					"get_hyperlinks — 获取超链接列表",
				],
			},
		};
	},
};

export default manageHyperlink;
