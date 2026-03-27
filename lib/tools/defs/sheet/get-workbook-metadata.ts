import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({});

const getWorkbookMetadata: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_workbook_metadata",
	displayName: "获取工作簿信息",
	description:
		"获取工作簿详细元信息，包括所有工作表列表、行列数、已用范围等。通常不需要调用——工作簿上下文（sheet 列表、活动 sheet、选区）已自动注入对话。仅当需要精确的行列数或 usedRange 坐标时才调用。",
	inputSchema,
	handler: async (workbook) => {
		const bridge = await loadBridge();
		return bridge.getWorkbookMetadata(workbook);
	},
};

export default getWorkbookMetadata;
