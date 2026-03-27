import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, normalizeColor, safe } from "../internal";

export function modifyShape(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		backColor?: string;
		borderColor?: string;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const shape = sheet.shapes.get(input.name);
		if (!shape) throw new Error(`形状 "${input.name}" 不存在`);

		if (input.x !== undefined) shape.x(input.x);
		if (input.y !== undefined) shape.y(input.y);
		if (input.width !== undefined) shape.width(input.width);
		if (input.height !== undefined) shape.height(input.height);

		if (input.backColor || input.borderColor) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const style = shape.style() as any;
			if (input.backColor) {
				style.fill.color = normalizeColor(input.backColor);
			}
			if (input.borderColor) {
				style.line.color = normalizeColor(input.borderColor);
			}
			shape.style(style);
		}

		return {
			name: input.name,
			x: shape.x(),
			y: shape.y(),
			width: shape.width(),
			height: shape.height(),
		};
	});
}
