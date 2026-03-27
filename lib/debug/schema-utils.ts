import type { z } from "zod/v4";

/**
 * 从 Zod 4 schema 生成默认参数模板 JSON。
 * 用于 Debug Panel 参数编辑器的初始值。
 */
export function schemaToTemplate(schema: z.ZodType): unknown {
	return walk(schema);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walk(schema: any): unknown {
	const def = schema._zod?.def ?? schema.def;
	if (!def) return null;

	switch (def.type) {
		case "string":
			return "";
		case "number":
			return 0;
		case "boolean":
			return false;
		case "any":
		case "unknown":
			return null;
		case "array":
			return [];
		case "enum":
			if (def.entries) {
				const keys = Object.keys(def.entries);
				return keys[0] ?? "";
			}
			return "";
		case "literal":
			return def.value;
		case "optional":
		case "nullable":
			// optional 字段：返回 undefined 让 Object 层跳过
			return undefined;
		case "object": {
			const result: Record<string, unknown> = {};
			if (def.shape) {
				for (const [key, val] of Object.entries(def.shape)) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const innerDef = (val as any)?._zod?.def ?? (val as any)?.def;
					// 跳过 optional 字段
					if (innerDef?.type === "optional" || innerDef?.type === "nullable") continue;
					const v = walk(val);
					if (v !== undefined) result[key] = v;
				}
			}
			return result;
		}
		case "union": {
			const options = def.options;
			if (options?.length > 0) return walk(options[0]);
			return null;
		}
		case "discriminatedUnion": {
			const options = def.options;
			if (options?.length > 0) return walk(options[0]);
			return null;
		}
		default:
			return null;
	}
}
