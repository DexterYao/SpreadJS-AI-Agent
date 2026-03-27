import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

export function changeActiveSheet(workbook: SpreadWorkbook, name: string) {
	return safe(() => {
		const sheet = workbook.getSheetFromName(name);
		if (!sheet) throw new Error(`工作表 "${name}" 不存在`);
		workbook.setActiveSheet(name);
		return { activeSheet: name };
	});
}
