import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	fileName: z.string().describe("文件名（含扩展名），如 data.xlsx。必须与用户上传的附件文件名一致"),
	fileBase64: z.string().optional().describe("文件的 Base64 编码内容（由前端自动注入，LLM 不需要填写）"),
});

const importFile: ToolDef<z.infer<typeof inputSchema>> = {
	name: "import_file",
	displayName: "导入文件",
	description:
		"导入 xlsx/csv/ssjson/sjs 文件到当前工作簿。用户通过附件按钮选择文件后，消息中会出现 [附件: xxx.xlsx] 标记。调用此工具时只需填 fileName（与附件名一致），fileBase64 由前端自动注入。导入会替换当前工作簿内容。",
	inputSchema,
	handler: async (workbook, input) => {
		if (!input.fileBase64) {
			return { success: false, error: "文件数据缺失，请重新上传文件" };
		}
		const bridge = await loadBridge();
		return bridge.importFile(workbook, input.fileName, input.fileBase64);
	},
};

export default importFile;
