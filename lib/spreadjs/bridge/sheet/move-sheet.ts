import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

export function moveSheet(
	workbook: SpreadWorkbook,
	name: string,
	targetIndex: number,
) {
	return safe(() => {
		const sheet = workbook.getSheetFromName(name);
		if (!sheet) throw new Error(`工作表 "${name}" 不存在`);
		const count = workbook.getSheetCount();
		if (targetIndex < 0 || targetIndex >= count) {
			throw new Error(`目标索引 ${targetIndex} 超出范围 [0, ${count - 1}]`);
		}
		workbook.changeSheetIndex(name, targetIndex);
		return { name, newIndex: targetIndex };
	});
}
