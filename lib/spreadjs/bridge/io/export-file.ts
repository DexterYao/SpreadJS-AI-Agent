import type { SpreadWorkbook, ToolResult } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet } from "../internal";

export async function exportFile(
	workbook: SpreadWorkbook,
	fileName: string,
	format: "xlsx" | "csv" | "pdf" | "sjs",
	sheetName?: string,
): Promise<ToolResult> {
	// PDF 导出前注册中文字体（仅首次，后续复用）
	if (format === "pdf") {
		const { ensurePdfFonts } = await import("@/lib/spreadjs/pdf-fonts");
		await ensurePdfFonts();
	}

	return new Promise((resolve) => {
		try {
			const triggerDownload = (blob: Blob) => {
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = fileName;
				a.click();
				URL.revokeObjectURL(url);
			};

			// CSV 加 UTF-8 BOM，避免 Excel 打开中文乱码
			const maybePrependBom = (blob: Blob): Blob => {
				if (format !== "csv") return blob;
				const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
				return new Blob([bom, blob], { type: "text/csv;charset=utf-8" });
			};

			if (format === "sjs") {
				workbook.save((blob: Blob) => {
					triggerDownload(blob);
					resolve({ success: true, data: { fileName, format } });
				}, (err: { errorMessage: string }) => {
					resolve({ success: false, error: err.errorMessage });
				});
			} else if (format === "pdf") {
				workbook.savePDF((blob: Blob) => {
					triggerDownload(blob);
					resolve({ success: true, data: { fileName, format } });
				}, (err: unknown) => {
					resolve({ success: false, error: String(err) });
				});
			} else {
				// xlsx / csv 走 export API
				const exportOptions: GC.Spread.Sheets.ExportOptions = format === "csv"
					? { fileType: GC.Spread.Sheets.FileType.csv }
					: { fileType: GC.Spread.Sheets.FileType.excel };
				// csv 导出指定 sheet 时，先切换活动表
				if (format === "csv" && sheetName) {
					const sheet = getSheet(workbook, sheetName);
					workbook.setActiveSheet(sheet.name());
				}
				workbook.export((blob: Blob) => {
					triggerDownload(maybePrependBom(blob));
					resolve({ success: true, data: { fileName, format } });
				}, (err: { errorMessage: string }) => {
					resolve({ success: false, error: err.errorMessage });
				}, exportOptions);
			}
		} catch (e) {
			resolve({ success: false, error: e instanceof Error ? e.message : String(e) });
		}
	}) as unknown as ToolResult;
}
