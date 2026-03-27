import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const stateTypeEnum = z.enum([
	"hover", "invalid", "readonly", "edit",
	"active", "selected", "dirty", "invalidFormula",
]);

const styleSchema = z.object({
	backColor: z.string().optional().describe("背景色，如 '#FF0000' 或 'red'"),
	foreColor: z.string().optional().describe("前景色（字体颜色）"),
	fontFamily: z.string().optional().describe("字体名称"),
	fontSize: z.number().optional().describe("字号（pt）"),
	bold: z.boolean().optional().describe("是否加粗"),
	italic: z.boolean().optional().describe("是否斜体"),
});

const inputSchema = z.object({
	range: z.string().describe('目标范围，如 "A1:B5"'),
	stateType: stateTypeEnum.describe(
		"状态类型。hover=鼠标悬停, active=获得焦点, selected=被选中, " +
		"dirty=值已修改, edit=编辑中, readonly=只读锁定, " +
		"invalid=验证失败, invalidFormula=非法公式",
	),
	style: styleSchema.describe("当状态匹配时应用的样式"),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const addCellState: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_cell_state",
	displayName: "添加单元格状态",
	module: "cell_state",
	description:
		"为指定范围添加单元格状态样式。当单元格进入指定状态时自动应用样式。" +
		"\n用途：仪表板交互反馈（hover 高亮）、表单输入提示（active 聚焦）、数据追踪（dirty 标记）。" +
		"\n优先级：edit > hover > active > selected > invalidFormula > dirty > invalid > readonly" +
		"\n示例：hover 高亮 → stateType='hover', style={backColor:'#FFD700'}" +
		"\n示例：脏值标红 → stateType='dirty', style={foreColor:'red'}",
	inputSchema,
	handler: async (workbook, input) => {
		const { addCellState: bridgeAdd } = await import("@/lib/spreadjs/bridge/cell-state");
		const range = resolveAddress(input.range);
		return bridgeAdd(workbook, input.sheetName ?? range.sheetName, {
			row: range.row,
			col: range.col,
			rowCount: range.rowCount,
			colCount: range.colCount,
			stateType: input.stateType,
			style: input.style,
		});
	},
};

export default addCellState;
