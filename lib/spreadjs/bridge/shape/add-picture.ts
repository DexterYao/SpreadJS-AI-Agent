import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function addPicture(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		base64?: string;
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		sheetName?: string;
	},
) {
	return safe(() => {
		if (!input.base64) {
			return { success: false as const, error: "base64 数据缺失，请确保已正确上传图片" };
		}
		const sheet = getSheet(workbook, input.sheetName);
		const x = input.x ?? 50;
		const y = input.y ?? 50;
		const w = input.width ?? 200;
		const h = input.height ?? 200;

		// 自动补全 data URI 前缀
		let src = input.base64;
		if (!src.startsWith("data:")) {
			src = `data:image/png;base64,${src}`;
		}

		sheet.shapes.addPictureShape(input.name, src, x, y, w, h);

		return { name: input.name, x, y, width: w, height: h };
	});
}
