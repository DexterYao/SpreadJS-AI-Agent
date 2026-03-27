import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要删除的形状名称"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const removeShape: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_shape",
	displayName: "删除形状",
	module: "shape",
	description: "按名称删除工作表中的形状或图片。",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeShape: bridge } = await import("@/lib/spreadjs/bridge/shape");
		return bridge(workbook, input);
	},
};

export default removeShape;
