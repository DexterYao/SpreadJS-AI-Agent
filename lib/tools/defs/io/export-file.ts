import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";

const inputSchema = z.object({
	fileName: z.string().describe('导出文件名，如 "report.xlsx"、"data.csv"、"output.pdf"、"backup.sjs"'),
	format: z.enum(["xlsx", "csv", "pdf", "sjs"]).describe("导出格式"),
	sheetName: z.string().optional().describe("csv 导出时指定工作表名称，其他格式忽略此参数"),
});

const exportFile: ToolDef<z.infer<typeof inputSchema>> = {
	name: "export_file",
	displayName: "导出文件",
	description:
		"导出当前工作簿为文件并触发浏览器下载。支持 xlsx/csv/pdf/sjs 格式。csv 格式可指定 sheetName（不指定则导出活动工作表）。pdf 格式导出整个工作簿，不支持指定单个 sheet。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		return bridge.exportFile(workbook, input.fileName, input.format, input.sheetName);
	},
};

export default exportFile;
