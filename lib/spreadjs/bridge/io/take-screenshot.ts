import type { SpreadWorkbook, ToolResult } from "@/lib/agent/types";

/** 截图结果 */
export interface ScreenshotData {
	imageBase64: string;
	width: number;
	height: number;
	sheetName: string;
}

/**
 * 捕获 SpreadJS 工作表的 canvas 截图，返回 PNG base64。
 *
 * 通过 workbook 内部属性获取宿主 DOM 元素，
 * 找到 SpreadJS 渲染用的 canvas 并调用 toDataURL() 生成 PNG。
 */
export function takeScreenshot(workbook: SpreadWorkbook): ToolResult<ScreenshotData> {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const host = (workbook as any).getHost();
		if (!(host instanceof HTMLElement)) {
			return { success: false, error: "无法获取 SpreadJS 宿主元素" };
		}

		const canvases = host.querySelectorAll("canvas");
		let canvas: HTMLCanvasElement | null = null;
		for (const c of canvases) {
			if (c.width > 0 && c.height > 0) {
				canvas = c as HTMLCanvasElement;
				break;
			}
		}
		if (!canvas) {
			return { success: false, error: "未找到 SpreadJS 渲染画布" };
		}

		const dataURL = canvas.toDataURL("image/png");

		return {
			success: true,
			data: {
				imageBase64: dataURL,
				width: canvas.width,
				height: canvas.height,
				sheetName: workbook.getActiveSheet().name(),
			},
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : String(e) };
	}
}
