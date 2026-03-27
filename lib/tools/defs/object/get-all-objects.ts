import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("工作表名称，省略则扫描所有工作表"),
});

const getAllObjects: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_all_objects",
	displayName: "获取图表和透视表",
	module: "chart",
	description:
		"获取工作簿中所有图表和透视表的元信息（名称、类型、位置、尺寸等）。用于在修改或删除图表/透视表前查询已有对象。可指定工作表，也可扫描全部工作表。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.getAllObjects(workbook, input.sheetName);
	},
};

export default getAllObjects;
