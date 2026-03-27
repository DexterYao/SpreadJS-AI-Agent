import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

interface RemoveCommentInput {
	row: number;
	col: number;
}

export function removeComment(workbook: SpreadWorkbook, sheetName: string | undefined, input: RemoveCommentInput) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const comment = sheet.comments.get(input.row, input.col);
		if (!comment) {
			throw new Error(`单元格 (${input.row}, ${input.col}) 没有批注`);
		}
		sheet.comments.remove(input.row, input.col);
		return {
			row: input.row,
			col: input.col,
			removed: true,
		};
	});
}
