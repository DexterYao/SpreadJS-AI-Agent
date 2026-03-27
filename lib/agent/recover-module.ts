import { getAppToolName, isAppToolPart, type AppUIMessage } from "@/lib/agent/ui-message";
import { isModuleName, moduleToolMap } from "@/lib/tools/registry";

/**
 * 从消息历史重建 activeModule 状态。
 *
 * 客户端工具（网关/模块子工具）执行后触发新 POST 请求，服务端 activeModule
 * 在每次请求中重新创建（let = null），必须从对话历史中恢复模块上下文。
 *
 * 逻辑：扫描最后一条 assistant 消息的 tool-invocation parts，
 * 按出现顺序检测网关或模块子工具，得出当前模块。
 * 若最后的工具调用之后存在文本内容，则视为模块工作已完成。
 */
export function recoverActiveModule(messages: AppUIMessage[]): string | null {
	// tool name → module 反向映射
	const toolToModule = new Map<string, string>();
	for (const [mod, tools] of Object.entries(moduleToolMap)) {
		for (const t of tools) toolToModule.set(t, mod);
	}

	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (msg.role !== "assistant") continue;

		const toolNames: string[] = [];
		let textAfterTools = false;

		for (const part of msg.parts) {
			if (isAppToolPart(part)) {
				toolNames.push(getAppToolName(part));
				textAfterTools = false;
			} else if (part.type === "text" && part.text?.trim()) {
				if (toolNames.length > 0) textAfterTools = true;
			}
		}

		// 无工具调用 或 工具调用后有文本回复 → 模块已结束
		if (toolNames.length === 0 || textAfterTools) return null;

		// 按顺序扫描，最后命中的网关/模块工具决定当前模块
		let detected: string | null = null;
		for (const name of toolNames) {
			if (name === "exit_module") {
				detected = null;
			} else if (name.startsWith("manage_")) {
				const mod = name.replace("manage_", "");
				if (isModuleName(mod)) detected = mod;
			} else if (toolToModule.has(name)) {
				detected = toolToModule.get(name)!;
			}
		}
		return detected;
	}
	return null;
}
