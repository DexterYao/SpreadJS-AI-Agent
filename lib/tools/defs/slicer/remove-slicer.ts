import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	name: z.string().describe("要删除的切片器名称"),
	sheetName: z.string().optional().describe("目标工作表，省略则为活动工作表"),
});

const removeSlicer: ToolDef<z.infer<typeof inputSchema>> = {
	name: "remove_slicer",
	displayName: "删除切片器",
	module: "slicer",
	description: "从工作表中删除指定切片器。删除不影响关联的表格或透视表数据。",
	inputSchema,
	handler: async (workbook, input) => {
		const { removeSlicer: bridge } = await import("@/lib/spreadjs/bridge/slicer");
		return bridge(workbook, input);
	},
};

export default removeSlicer;
