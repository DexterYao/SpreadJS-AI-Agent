/**
 * 只读工具结果短时缓存。
 *
 * 同一参数（toolName + input）在 TTL 内不重复执行 handler，直接返回缓存结果。
 * 任何写入类工具执行后清空全部缓存，保证数据一致性。
 */

const READ_ONLY_TOOLS = new Set([
	"read_ranges",
	"get_workbook_metadata",
	"get_all_objects",
	"get_cell_format",
	"trace_dependencies",
]);

const CACHE_TTL = 5_000; // 5 秒

interface CacheEntry {
	result: unknown;
	ts: number;
}

export interface ToolCache {
	get(name: string, input: unknown): unknown | undefined;
	set(name: string, input: unknown, result: unknown): void;
	/** 清空全部缓存（写入类工具执行后调用） */
	invalidate(): void;
	/** 判断工具是否为只读（可缓存） */
	isReadOnly(name: string): boolean;
}

export function createToolCache(): ToolCache {
	const cache = new Map<string, CacheEntry>();

	function makeKey(name: string, input: unknown): string {
		return `${name}:${JSON.stringify(input)}`;
	}

	return {
		get(name: string, input: unknown): unknown | undefined {
			if (!READ_ONLY_TOOLS.has(name)) return undefined;
			const key = makeKey(name, input);
			const entry = cache.get(key);
			if (!entry || Date.now() - entry.ts > CACHE_TTL) {
				cache.delete(key);
				return undefined;
			}
			return entry.result;
		},

		set(name: string, input: unknown, result: unknown): void {
			if (!READ_ONLY_TOOLS.has(name)) return;
			cache.set(makeKey(name, input), { result, ts: Date.now() });
		},

		invalidate(): void {
			cache.clear();
		},

		isReadOnly(name: string): boolean {
			return READ_ONLY_TOOLS.has(name);
		},
	};
}
