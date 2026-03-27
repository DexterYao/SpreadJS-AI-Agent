import { checkEnv } from "@/lib/env-check";

export async function GET() {
	const result = checkEnv();
	return Response.json(result);
}
