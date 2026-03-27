import type { SpreadWorkbook } from "@/lib/agent/types";
import { getSheet, safe } from "../internal";

export function protectSheet(
	workbook: SpreadWorkbook,
	name: string,
	protect: boolean,
	password?: string,
) {
	return safe(() => {
		const sheet = getSheet(workbook, name);
		if (protect) {
			if (password) {
				sheet.protect(password);
			} else {
				sheet.options.isProtected = true;
			}
			return { name, isProtected: true };
		} else {
			if (sheet.hasPassword()) {
				if (!password) throw new Error(`工作表 "${name}" 设有密码，取消保护需要提供密码`);
				const ok = sheet.unprotect(password);
				if (!ok) throw new Error("密码错误，无法取消保护");
			} else {
				sheet.options.isProtected = false;
			}
			return { name, isProtected: false };
		}
	});
}
