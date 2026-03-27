import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("工作表名称"),
	color: z.string().describe("标签颜色，支持 CSS 颜色格式：如 \"red\"、\"#FF0000\"、\"rgb(255,0,0)\""),
});

const setTabColor: ToolDef<z.infer<typeof inputSchema>> = {
	name: "set_tab_color",
	displayName: "设置标签颜色",
	description:
		"设置工作表标签的背景颜色，用于视觉区分不同用途的工作表。支持 CSS 颜色字符串。设置为空字符串可清除颜色。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.setTabColor(workbook, input.name, input.color);
	},
};

export default setTabColor;
