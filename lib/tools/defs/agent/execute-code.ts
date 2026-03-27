import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	code: z.string().describe("要执行的 JavaScript 代码"),
	description: z.string().describe("代码功能的简短描述"),
});

const executeCode: ToolDef<z.infer<typeof inputSchema>> = {
	name: "execute_code",
	displayName: "执行代码",
	description: `在浏览器中执行 JavaScript 代码操作 SpreadJS 工作簿。

可用变量：
- workbook — GC.Spread.Sheets.Workbook 实例
- sheet — 当前活动工作表
- GC — SpreadJS 命名空间
- log(...args) — 输出日志

使用标准 SpreadJS API。批量读写推荐 sheet.getArray() / sheet.setArray()。

⚠ 强制要求（每次调用前必须执行）：
如果 SpreadJS MCP（mcp__spreadjs-mcp__search）可用，必须先搜索所用 API 的签名和用法，再编写代码。禁止跳过此步骤直接执行代码。

约束：仅同步代码（禁止 async/await），suspend/resume 由框架管理，异常自动回滚。`,
	inputSchema,
	handler: async (workbook, input) => {
		const { executeSandboxed } = await import("@/lib/spreadjs/sandbox");
		return executeSandboxed(workbook, input.code, input.description);
	},
};

export default executeCode;
