import { getToolDef, isServerTool } from "@/lib/tools/registry";
import type { ToolDef } from "@/lib/tools/types";
import { errorLogger } from "@/lib/logging";

export async function POST(req: Request) {
	if (process.env.NODE_ENV === "production") {
		return Response.json(
			{ error: "Debug endpoint disabled in production" },
			{ status: 403 },
		);
	}

	try {
		const { toolName, input } = await req.json();

		if (!isServerTool(toolName)) {
			return Response.json(
				{ error: `"${toolName}" 不是服务端工具，请在客户端执行` },
				{ status: 400 },
			);
		}

		const def = getToolDef(toolName) as ToolDef | undefined;
		if (!def?.execute) {
			return Response.json(
				{ error: `工具 "${toolName}" 无 execute 函数` },
				{ status: 404 },
			);
		}

		const t0 = performance.now();
		const result = await def.execute(input);
		const durationMs = Math.round((performance.now() - t0) * 100) / 100;

		// 捕获工具返回的错误结果
		if (typeof result === "object" && result !== null) {
			errorLogger.captureToolResult(toolName, result as { success?: boolean; error?: string });
		}

		return Response.json({ result, durationMs });
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		console.error("[debug/tool-call]", message);
		errorLogger.capture("debug/tool-call", e, { source: "debug/tool-call" });
		return Response.json({ error: message }, { status: 500 });
	}
}
