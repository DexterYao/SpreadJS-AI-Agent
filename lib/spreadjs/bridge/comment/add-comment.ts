import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

interface AddCommentInput {
	row: number;
	col: number;
	text: string;
}

export function addComment(workbook: SpreadWorkbook, sheetName: string | undefined, input: AddCommentInput) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		// 若已有批注则先移除
		const existing = sheet.comments.get(input.row, input.col);
		if (existing) {
			sheet.comments.remove(input.row, input.col);
		}
		sheet.comments.add(input.row, input.col, input.text);
		return {
			row: input.row,
			col: input.col,
			text: input.text,
			replaced: !!existing,
		};
	});
}
