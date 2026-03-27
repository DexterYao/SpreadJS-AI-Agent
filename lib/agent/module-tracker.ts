import { isModuleName, moduleToolMap } from "@/lib/tools/registry";

interface ToolFilterParams {
	allTools: Record<string, unknown>;
	baseTools: string[];
	gatewayTools: string[];
	mcpTools: string[];
}

/**
 * 渐进式 API 披露的模块状态机。
 *
 * 封装 activeModule 可变状态，提供两个方法：
 * - resolveActiveTools：prepareStep 时计算当前可用工具
 * - transition：onStepFinish 时根据工具调用更新模块状态
 */
export class ModuleTracker {
	activeModule: string | null;

	constructor(initial: string | null) {
		this.activeModule = initial;
		if (initial) {
			console.log(`[activeModule] 从消息历史恢复模块: ${initial}`);
		}
	}

	/** 返回当前步应暴露给 LLM 的工具名列表 */
	resolveActiveTools({ allTools, baseTools, gatewayTools, mcpTools }: ToolFilterParams): string[] {
		if (this.activeModule && isModuleName(this.activeModule)) {
			const moduleTools = [...moduleToolMap[this.activeModule]].filter((n) => n in allTools);
			const active = [...baseTools, ...moduleTools, "exit_module", ...mcpTools];
			console.log(
				`[prepareStep] 模块模式: ${this.activeModule} | 工具数: ${active.length} | 模块工具: [${moduleTools.join(", ")}]`,
			);
			return active;
		}

		const active = [...baseTools, ...gatewayTools, ...mcpTools];
		console.log(
			`[prepareStep] 默认模式 | 工具数: ${active.length} | 网关: [${gatewayTools.join(", ")}]`,
		);
		return active;
	}

	/** 根据本步工具调用结果推进模块状态 */
	transition(toolCalls: Array<{ toolName: string }>): void {
		if (!toolCalls.length) {
			if (this.activeModule) {
				console.log(`[onStepFinish] 无工具调用，退出模块: ${this.activeModule}`);
			}
			this.activeModule = null;
			return;
		}

		let nextModule: string | null = this.activeModule;

		for (const call of toolCalls) {
			if (call.toolName === "exit_module") {
				nextModule = null;
			} else if (call.toolName.startsWith("manage_")) {
				const mod = call.toolName.replace("manage_", "");
				if (isModuleName(mod)) nextModule = mod;
			}
		}

		if (nextModule && isModuleName(nextModule)) {
			const moduleTools: string[] = [...moduleToolMap[nextModule]];
			const usedModuleTool = toolCalls.some(c => moduleTools.includes(c.toolName));
			const hasGateway = toolCalls.some(c => c.toolName.startsWith("manage_"));
			if (!usedModuleTool && !hasGateway) nextModule = null;
		}

		const toolNames = toolCalls.map(c => c.toolName);
		console.log(
			`[onStepFinish] 调用: [${toolNames.join(", ")}] | 模块: ${this.activeModule ?? "无"} → ${nextModule ?? "无"}`,
		);
		this.activeModule = nextModule;
	}
}
