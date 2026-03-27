import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	address: z.string().describe('起始地址，如 "A1" 或 "Sheet1!B2"'),
	data: z
		.array(z.union([z.array(z.any()), z.null()]))
		.describe(
			"稀疏二维数组。行为 null 则跳过整行；行内 null 跳过该 cell（保留原值）；行末空值可省略（短行）。示例：[[\"名\",\"龄\"],[\"张三\",25],null,[null,null,\"财务\"]]",
		),
});

const writeData: ToolDef<z.infer<typeof inputSchema>> = {
	name: "write_data",
	displayName: "写入数据",
	description:
		'批量写入数据。data 为稀疏二维数组：行为 null 跳过整行，cell 为 null 跳过该格（保留原值），行末空值可省略。公式以"="开头。写入后自动校验公式结果。若需清空请用 clear_cells。',
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.address);
		range.rowCount = input.data.length;
		range.colCount = Math.max(
			...input.data.map((r) => (r ? r.length : 0)),
			1,
		);
		return bridge.writeData(workbook, range, input.data);
	},
};

export default writeData;
