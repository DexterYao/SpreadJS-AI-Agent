import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

type Visibility = "visible" | "hidden" | "veryHidden";

/** GC.Spread.Sheets.SheetTabVisible 枚举值（避免模块级访问 GC 导致测试环境报错） */
const visibilityMap: Record<Visibility, number> = {
	hidden: 0,
	visible: 1,
	veryHidden: 2,
};

export function hideShowSheet(
	workbook: SpreadWorkbook,
	name: string,
	visibility: Visibility,
) {
	return safe(() => {
		const sheet = workbook.getSheetFromName(name);
		if (!sheet) throw new Error(`工作表 "${name}" 不存在`);
		const val = visibilityMap[visibility];
		if (val === undefined) {
			throw new Error(`无效的可见性: "${visibility}"，可选: visible, hidden, veryHidden`);
		}
		sheet.visible(val);
		return { name, visibility };
	});
}
