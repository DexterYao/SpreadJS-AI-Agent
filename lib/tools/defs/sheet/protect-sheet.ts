import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("工作表名称"),
	protect: z.boolean().describe("true=保护，false=取消保护"),
	password: z
		.string()
		.optional()
		.describe("保护密码。设置保护时可选（不设则无密码保护）；取消保护时如果之前设了密码则必须提供"),
});

const protectSheet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "protect_sheet",
	displayName: "保护工作表",
	description:
		"保护或取消保护工作表。保护后用户无法编辑锁定的单元格、无法插入删除行列等。可选设置密码。取消保护时如果有密码需要提供正确密码。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.protectSheet(workbook, input.name, input.protect, input.password);
	},
};

export default protectSheet;
