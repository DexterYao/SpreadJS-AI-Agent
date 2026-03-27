import { mcpManager } from "@/lib/mcp";

export async function POST(req: Request) {
	let body: { serverName?: string };
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const { serverName } = body;
	if (!serverName || typeof serverName !== "string") {
		return Response.json({ error: "serverName is required" }, { status: 400 });
	}

	try {
		const result = await mcpManager.startAuth(serverName);
		console.log(`[MCP:OAuth] startAuth success:`, result.authorizationUrl.slice(0, 100));
		return Response.json(result);
	} catch (e) {
		console.error(`[MCP:OAuth] startAuth failed:`, e instanceof Error ? e.message : e);
		return Response.json(
			{ error: e instanceof Error ? e.message : String(e) },
			{ status: 400 },
		);
	}
}
