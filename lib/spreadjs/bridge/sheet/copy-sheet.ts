import type { SpreadWorkbook } from "@/lib/agent/types";
import { safe } from "../internal";

export function copySheet(
	workbook: SpreadWorkbook,
	name: string,
	newName: string,
	targetIndex?: number,
) {
	return safe(() => {
		const srcSheet = workbook.getSheetFromName(name);
		if (!srcSheet) throw new Error(`工作表 "${name}" 不存在`);
		if (workbook.getSheetFromName(newName)) {
			throw new Error(`工作表 "${newName}" 已存在`);
		}
		const insertAt = targetIndex ?? workbook.getSheetCount();
		workbook.commandManager().execute({
			cmd: "copySheet",
			sheetName: name,
			targetIndex: insertAt,
			newName,
			includeBindingSource: true,
		});
		return { name: newName, index: insertAt };
	});
}
