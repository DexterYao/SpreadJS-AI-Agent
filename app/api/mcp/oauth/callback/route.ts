import { mcpManager } from "@/lib/mcp";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const code = searchParams.get("code") ?? "";
	const state = searchParams.get("state") ?? "";
	const error = searchParams.get("error") ?? "";

	let resultPayload: { success: boolean; serverName?: string; error?: string };

	if (error) {
		resultPayload = { success: false, error };
	} else if (!code || !state) {
		resultPayload = { success: false, error: "Missing code or state" };
	} else {
		try {
			const serverName = await mcpManager.completeAuth(state, code);
			resultPayload = { success: true, serverName };
		} catch (e) {
			resultPayload = {
				success: false,
				error: e instanceof Error ? e.message : String(e),
			};
		}
	}

	// 安全嵌入 JSON，BroadcastChannel 通知主窗口后关闭弹窗
	// escape </ 防止 script block 被截断（XSS）
	const payload = JSON.stringify(resultPayload).replace(/</g, "\\u003c");
	const displayMsg = resultPayload.success
		? "授权成功，正在关闭…"
		: `授权失败: ${escapeHtml(resultPayload.error ?? "unknown")}`;
	const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>OAuth 授权</title></head>
<body>
<p>${displayMsg}</p>
<script>
try {
	const bc = new BroadcastChannel("mcp-oauth");
	bc.postMessage(${payload});
	bc.close();
} catch(e) { console.error(e); }
setTimeout(() => window.close(), 1500);
</script>
</body></html>`;

	return new Response(html, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
