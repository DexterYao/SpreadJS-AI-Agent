import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	targetCell: z.string().describe('包含公式的目标单元格，如 "B4" 或 "Sheet1!B4"'),
	targetValue: z.number().describe("期望的公式计算结果"),
	changingCell: z.string().describe('可变单元格（调整此单元格的值以达到目标），如 "B3"'),
});

const goalSeek: ToolDef<z.infer<typeof inputSchema>> = {
	name: "goal_seek",
	displayName: "目标求解",
	description:
		"通过调整可变单元格的值，使目标单元格的公式结果达到期望值。目标单元格必须包含公式，可变单元格必须被该公式直接或间接引用。典型场景：已知贷款金额和期限，求满足月供目标的利率。若公式无法收敛到目标值会返回错误。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.goalSeek(workbook, input.targetCell, input.targetValue, input.changingCell);
	},
};

export default goalSeek;
