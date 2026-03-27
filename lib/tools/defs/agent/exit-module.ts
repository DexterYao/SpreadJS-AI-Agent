import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({});

const exitModule: ToolDef<z.infer<typeof inputSchema>> = {
	name: "exit_module",
	displayName: "退出模块",
	description:
		"显式退出当前模块模式，返回默认工具集。通常模块会自动退出，仅在需要强制切换时使用。",
	inputSchema,
	execute: async () => {
		return {
			success: true,
			data: { message: "已退出模块模式" },
		};
	},
};

export default exitModule;
