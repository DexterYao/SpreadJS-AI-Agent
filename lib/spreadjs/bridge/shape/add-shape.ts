import type { SpreadWorkbook } from "@/lib/agent/types";
import GC from "@grapecity-software/spread-sheets";
import { getSheet, normalizeColor, safe } from "../internal";

/** AutoShapeType 名称到枚举值的映射（LLM 友好子集），懒初始化避免模块求值时 Shapes 未加载 */
let shapeTypeMap: Record<string, number> | null = null;
function getShapeTypeMap(): Record<string, number> {
	if (shapeTypeMap) return shapeTypeMap;
	const T = GC.Spread.Sheets.Shapes.AutoShapeType;
	shapeTypeMap = {
		rectangle: T.rectangle,
		roundedRectangle: T.roundedRectangle,
		oval: T.oval,
		diamond: T.diamond,
		triangle: T.isoscelesTriangle,
		rightTriangle: T.rightTriangle,
		parallelogram: T.parallelogram,
		trapezoid: T.trapezoid,
		pentagon: T.pentagon,
		hexagon: T.hexagon,
		octagon: T.octagon,
		heart: T.heart,
		donut: T.donut,
		shape4pointStar: T.shape4pointStar,
		shape5pointStar: T.shape5pointStar,
		shape8pointStar: T.shape8pointStar,
		rightArrow: T.rightArrow,
		leftArrow: T.leftArrow,
		upArrow: T.upArrow,
		downArrow: T.downArrow,
		cloud: T.cloud,
		lightningBolt: T.lightningBolt,
		smileyFace: T.smileyFace,
		moon: T.moon,
		sun: T.sun,
	};
	return shapeTypeMap;
}

export function addShape(
	workbook: SpreadWorkbook,
	input: {
		name: string;
		type: string;
		x: number;
		y: number;
		width: number;
		height: number;
		backColor?: string;
		borderColor?: string;
		borderWidth?: number;
		sheetName?: string;
	},
) {
	return safe(() => {
		const sheet = getSheet(workbook, input.sheetName);
		const map = getShapeTypeMap();
		const shapeType = map[input.type];
		if (shapeType === undefined) {
			throw new Error(
				`不支持的形状类型 "${input.type}"。可用: ${Object.keys(map).join(", ")}`,
			);
		}

		const shape = sheet.shapes.add(
			input.name, shapeType, input.x, input.y, input.width, input.height,
		);

		// 应用样式
		if (input.backColor || input.borderColor || input.borderWidth) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const style = shape.style() as any;
			if (input.backColor) {
				style.fill.color = normalizeColor(input.backColor);
			}
			if (input.borderColor) {
				style.line.color = normalizeColor(input.borderColor);
			}
			if (input.borderWidth !== undefined) {
				style.line.width = input.borderWidth;
			}
			shape.style(style);
		}

		return {
			name: shape.name(),
			type: input.type,
			x: input.x,
			y: input.y,
			width: input.width,
			height: input.height,
		};
	});
}
