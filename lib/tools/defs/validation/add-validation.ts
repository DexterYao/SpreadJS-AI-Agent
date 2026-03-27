import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const operatorEnum = z.enum([
	"between", "notBetween",
	"equalTo", "notEqualTo",
	"greaterThan", "greaterThanOrEqualTo",
	"lessThan", "lessThanOrEqualTo",
]);

const inputSchema = z.object({
	range: z.string().describe('目标范围，如 "A1:A10" 或 "Sheet1!B2:B20"'),
	type: z.enum(["list", "number", "date", "textLength", "formula"])
		.describe("验证类型：list=下拉列表, number=数字范围, date=日期范围, textLength=文本长度, formula=自定义公式"),
	// list 专用
	source: z.string().optional()
		.describe('list 类型的数据源。逗号分隔值如 "苹果,香蕉,橙子"，或引用范围如 "=$A$1:$A$5"'),
	// number / date / textLength 共用
	operator: operatorEnum.optional()
		.describe("比较运算符（number/date/textLength 必填）"),
	value1: z.union([z.number(), z.string()]).optional()
		.describe("第一个比较值（number/date/textLength 必填）。date 类型传日期字符串如 2024-01-01"),
	value2: z.union([z.number(), z.string()]).optional()
		.describe("第二个比较值（between/notBetween 时必填）"),
	integerOnly: z.boolean().optional()
		.describe("number 类型是否仅允许整数，默认 false"),
	// formula 专用
	formula: z.string().optional()
		.describe('formula 类型的公式条件，如 "A1>0"'),
	// 提示信息
	inputTitle: z.string().optional().describe("输入提示标题"),
	inputMessage: z.string().optional().describe("输入提示消息"),
	errorTitle: z.string().optional().describe("错误提示标题"),
	errorMessage: z.string().optional().describe("错误提示消息"),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const addValidation: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_validation",
	displayName: "添加数据验证",
	module: "validation",
	description:
		"为指定范围添加数据验证规则。支持下拉列表(list)、数字范围(number)、日期范围(date)、文本长度(textLength)、自定义公式(formula)五种类型。" +
		"\n示例：下拉列表 → type='list', source='选项A,选项B,选项C'" +
		"\n示例：数字范围 → type='number', operator='between', value1=1, value2=100" +
		"\n示例：引用列表 → type='list', source='=$A$1:$A$5'",
	inputSchema,
	handler: async (workbook, input) => {
		const { addValidation: bridgeAdd } = await import("@/lib/spreadjs/bridge/validation");
		const range = resolveAddress(input.range);
		return bridgeAdd(workbook, input.sheetName ?? range.sheetName, {
			row: range.row,
			col: range.col,
			rowCount: range.rowCount,
			colCount: range.colCount,
			type: input.type,
			source: input.source,
			operator: input.operator,
			value1: input.value1,
			value2: input.value2,
			integerOnly: input.integerOnly,
			formula: input.formula,
			inputTitle: input.inputTitle,
			inputMessage: input.inputMessage,
			errorTitle: input.errorTitle,
			errorMessage: input.errorMessage,
		});
	},
};

export default addValidation;
