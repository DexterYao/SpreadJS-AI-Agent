export type DebugStage =
	| "schema_validation"
	| "handler_resolution"
	| "env_check"
	| "execution"
	| "result_format";

export interface DebugLogEntry {
	stage: DebugStage;
	status: "ok" | "error" | "warn" | "skip";
	durationMs: number;
	input?: unknown;
	output?: unknown;
	error?: string;
	detail?: string;
}

export interface DebugSession {
	toolName: string;
	startedAt: number;
	logs: DebugLogEntry[];
	result?: unknown;
	totalMs: number;
}
