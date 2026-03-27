import { getUsage } from "@/lib/llm/usage-store";
import { MODEL_CONTEXT_WINDOW } from "@/lib/config";

export async function GET() {
	const usage = getUsage();
	return Response.json({
		usage,
		contextWindow: MODEL_CONTEXT_WINDOW,
	});
}
