import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function addImage(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		url: string;
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const x = input.x ?? 50;
		const y = input.y ?? 50;
		const w = input.width ?? 200;
		const h = input.height ?? 200;

		sheet.shapes.addPictureShape(input.name, input.url, x, y, w, h);

		return { name: input.name, url: input.url, x, y, width: w, height: h };
	});
}
