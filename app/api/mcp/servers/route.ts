import { mcpManager } from "@/lib/mcp";
import { McpConfigSchema } from "@/lib/mcp/types";

export async function GET() {
	return Response.json({ servers: await mcpManager.getStatus() });
}

export async function POST(req: Request) {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return Response.json(
			{ error: "Invalid JSON" },
			{ status: 400 },
		);
	}

	const parsed = McpConfigSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(
			{ error: "Validation failed", issues: parsed.error.issues },
			{ status: 400 },
		);
	}

	await mcpManager.applyConfig(parsed.data);
	return Response.json({ servers: await mcpManager.getStatus() });
}
