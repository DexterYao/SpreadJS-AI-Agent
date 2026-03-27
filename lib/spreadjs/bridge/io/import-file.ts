import type { SpreadWorkbook, ToolResult } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";

export function importFile(
	workbook: SpreadWorkbook,
	fileName: string,
	fileBase64: string,
): ToolResult {
	const ext = fileName.split(".").pop()?.toLowerCase();

	// Base64 → File（SpreadJS API 要求 File 而非 Blob）
	const binary = atob(fileBase64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const blob = new File([bytes], fileName);

	return new Promise((resolve) => {
		try {
			if (ext === "sjs") {
				workbook.open(blob, () => {
					resolve({ success: true, data: { fileName, format: "sjs" } });
				}, (err: { errorMessage: string }) => {
					resolve({ success: false, error: err.errorMessage });
				});
			} else if (ext === "ssjson" || ext === "json") {
				const reader = new FileReader();
				reader.onload = () => {
					try {
						const json = JSON.parse(reader.result as string);
						workbook.fromJSON(json);
						resolve({ success: true, data: { fileName, format: "ssjson" } });
					} catch (e) {
						resolve({ success: false, error: e instanceof Error ? e.message : String(e) });
					}
				};
				reader.readAsText(blob);
			} else {
				// xlsx, csv 等走 IO 模块
				const importOptions: GC.Spread.Sheets.ImportOptions = ext === "csv"
					? { fileType: GC.Spread.Sheets.FileType.csv }
					: { fileType: GC.Spread.Sheets.FileType.excel };
				workbook.import(blob, () => {
					resolve({ success: true, data: { fileName, format: ext } });
				}, (err: { errorMessage: string }) => {
					resolve({ success: false, error: err.errorMessage });
				}, importOptions);
			}
		} catch (e) {
			resolve({ success: false, error: e instanceof Error ? e.message : String(e) });
		}
	}) as unknown as ToolResult;
}
