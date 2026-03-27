import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	frozenRows: z.number().int().min(0).default(0).describe("冻结的行数（从顶部开始）"),
	frozenColumns: z.number().int().min(0).default(0).describe("冻结的列数（从左侧开始）"),
	trailingRows: z.number().int().min(0).optional().describe("冻结的尾部行数"),
	trailingColumns: z.number().int().min(0).optional().describe("冻结的尾部列数"),
	sheetName: z.string().optional().describe("工作表名称，省略则为活动工作表"),
});

const freezePanes: ToolDef<z.infer<typeof inputSchema>> = {
	name: "freeze_panes",
	displayName: "冻结窗格",
	description:
		"冻结或取消冻结行列。冻结的行列在滚动时保持可见。frozenRows=1 冻结首行（常用于表头），frozenColumns=1 冻结首列。全部设为 0 则取消冻结。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.freezePanes(
			workbook, input.sheetName,
			input.frozenRows, input.frozenColumns,
			input.trailingRows, input.trailingColumns,
		);
	},
};

export default freezePanes;
