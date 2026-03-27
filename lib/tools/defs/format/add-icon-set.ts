import { z } from "zod/v4";
import { loadBridge, type ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	address: z.string().describe('应用范围，如 "A1:A20"'),
	iconSetType: z.enum([
		"threeArrowsColored", "threeArrowsGray",
		"threeTriangles",
		"threeStars",
		"threeFlags",
		"threeTrafficLightsUnrimmed", "threeTrafficLightsRimmed",
		"threeSigns",
		"threeSymbolsCircled", "threeSymbolsUncircled",
		"fourArrowsColored", "fourArrowsGray",
		"fourRedToBlack",
		"fourRatings",
		"fourTrafficLights",
		"fiveArrowsColored", "fiveArrowsGray",
		"fiveRatings",
		"fiveQuarters",
		"fiveBoxes",
	]).describe("图标集类型"),
	reverseIconOrder: z.boolean().default(false).describe("是否反转图标顺序"),
	showIconOnly: z.boolean().default(false).describe("仅显示图标，隐藏单元格值"),
});

const addIconSet: ToolDef<z.infer<typeof inputSchema>> = {
	name: "add_icon_set",
	displayName: "图标集",
	module: "conditional_formatting",
	description:
		"为指定范围添加图标集条件格式。根据数值自动分配图标（箭头、交通灯、星级等），适合直观展示绩效/趋势等分类状态。不适合数值比较 — 请用 add_data_bar 或 add_color_scale。",
	inputSchema,
	handler: async (workbook, input) => {
		const bridge = await loadBridge();
		const range = resolveAddress(input.address);
		return bridge.addIconSet(workbook, range, input);
	},
};

export default addIconSet;
