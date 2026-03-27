import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

interface EditCommentInput {
	row: number;
	col: number;
	text: string;
}

export function editComment(workbook: SpreadWorkbook, sheetName: string | undefined, input: EditCommentInput) {
	return safe(() => {
		const sheet = getSheet(workbook, sheetName);
		const comment = sheet.comments.get(input.row, input.col);
		if (!comment) {
			throw new Error(`单元格 (${input.row}, ${input.col}) 没有批注`);
		}
		comment.text(input.text);
		return {
			row: input.row,
			col: input.col,
			newText: input.text,
		};
	});
}
