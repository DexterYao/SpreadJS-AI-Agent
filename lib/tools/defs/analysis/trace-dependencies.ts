import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	cell: z.string().describe('单元格地址，如 "B5" 或 "Sheet1!C10"'),
	direction: z.enum(["precedents", "dependents", "both"]).default("both")
		.describe("追踪方向：precedents=引用了哪些单元格，dependents=被哪些公式引用，both=双向"),
	maxDepth: z.number().int().min(1).max(10).default(5)
		.describe("最大递归深度，防止循环引用导致死循环"),
});

const traceDependencies: ToolDef<z.infer<typeof inputSchema>> = {
	name: "trace_dependencies",
	displayName: "追踪公式依赖",
	description:
		"追踪单元格的公式依赖链，返回树状结构。precedents=该单元格的公式引用了哪些单元格；dependents=哪些公式引用了该单元格。无公式或空单元格返回空数组。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.traceDependencies(workbook, input.cell, input.direction, input.maxDepth);
	},
};

export default traceDependencies;
