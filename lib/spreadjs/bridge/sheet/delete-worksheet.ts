import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

export function deleteWorksheet(
	workbook: SpreadWorkbook,
	name: string,
) {
	return safe(() => {
		const sheet = workbook.getSheetFromName(name);
		if (!sheet) throw new Error(`工作表 "${name}" 不存在`);
		const index = workbook.getSheetIndex(name);
		if (workbook.getSheetCount() <= 1) throw new Error("无法删除唯一的工作表");
		workbook.removeSheet(index);
		return null;
	});
}
