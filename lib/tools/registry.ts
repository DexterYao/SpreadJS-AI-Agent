import type { ToolDef } from "./types";
import * as defs from "./defs";
export {
	baseToolNames,
	builtinToolNames,
	gatewayToolNames,
	isModuleName,
	moduleToolMap,
	type BaseToolName,
	type BuiltinToolName,
	type GatewayToolName,
	type ModuleName,
	type ModuleToolName,
} from "@/lib/tools/names";

// ─── 工具注册 ───────────────────────────────────────────────

const allToolsArray: ToolDef[] = Object.values(defs) as ToolDef[];
const toolMap = new Map(allToolsArray.map((t) => [t.name, t]));

/**
 * 给 streamText 的 tools 配置。
 * - 客户端工具（有 handler）：仅 schema，由前端 onToolCall 拦截
 * - 服务端工具（有 execute）：schema + execute，由 streamText 自动执行
 */
export const toolDefinitions: Record<string, {
	description: string;
	inputSchema: ToolDef["inputSchema"];
	execute?: (args: Record<string, unknown>) => Promise<unknown>;
}> = Object.fromEntries(
	allToolsArray.map((t) => [
		t.name,
		t.execute
			? { description: t.description, inputSchema: t.inputSchema, execute: t.execute }
			: { description: t.description, inputSchema: t.inputSchema },
	]),
);

/** 工具总数 */
export const toolCount = allToolsArray.length;

/** 获取工具中文名 */
export function getDisplayName(name: string): string {
	const builtin = toolMap.get(name);
	if (builtin) return builtin.displayName;

	const mcp = parseMcpName(name);
	if (mcp) return mcp.toolName;

	return name;
}

/** 解析 MCP 工具名 → { serverName, toolName }，非 MCP 工具返回 null */
export function parseMcpName(name: string): { serverName: string; toolName: string } | null {
	if (!name.startsWith("mcp__")) return null;
	const parts = name.split("__");
	if (parts.length < 3) return null;
	return { serverName: parts[1], toolName: parts.slice(2).join("__") };
}

/** 获取客户端工具 handler（server 工具返回 undefined） */
export function getHandler(name: string): ToolDef["handler"] | undefined {
	const tool = toolMap.get(name);
	return tool?.handler;
}

/** 判断工具是否为服务端执行（有 execute 且无 handler） */
export function isServerTool(name: string): boolean {
	const tool = toolMap.get(name);
	return !!tool?.execute && !tool.handler;
}

/** Debug 专用：获取工具完整定义 */
export function getToolDef(name: string): ToolDef | undefined {
	return toolMap.get(name);
}

/** Debug 专用：所有工具元信息列表 */
export function getToolList(): Array<{
	name: string;
	displayName: string;
	hasHandler: boolean;
	hasExecute: boolean;
}> {
	return allToolsArray.map((t) => ({
		name: t.name,
		displayName: t.displayName,
		hasHandler: !!t.handler,
		hasExecute: !!t.execute,
	}));
}
