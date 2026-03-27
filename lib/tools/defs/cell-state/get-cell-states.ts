import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const getCellStates: ToolDef<z.infer<typeof inputSchema>> = {
	name: "get_cell_states",
	displayName: "获取单元格状态",
	module: "cell_state",
	description:
		"获取指定 sheet 上已配置的所有单元格状态样式信息。返回每条状态规则的范围、状态类型和样式。",
	inputSchema,
	handler: async (workbook, input) => {
		const { getCellStates: bridgeGet } = await import("@/lib/spreadjs/bridge/cell-state");
		return bridgeGet(workbook, input.sheetName);
	},
};

export default getCellStates;
