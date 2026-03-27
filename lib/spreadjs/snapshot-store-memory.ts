import type { SpreadWorkbook } from "@/lib/agent/types";

/**
 * 内存快照存储 — 用于 execute_code 代码执行期间的临时快照。
 * 执行出错时自动回滚，成功后可由调用方 discard。FIFO 淘汰。
 */
export class SnapshotStoreMemory {
	private snapshots = new Map<string, object>();
	private maxSnapshots: number;

	constructor(maxSnapshots = 10) {
		this.maxSnapshots = maxSnapshots;
	}

	save(id: string, workbook: SpreadWorkbook): void {
		this.saveJson(id, workbook.toJSON());
	}

	/** 存储预序列化的 JSON，避免重复调用 toJSON */
	saveJson(id: string, json: object): void {
		if (this.snapshots.size >= this.maxSnapshots) {
			const oldest = this.snapshots.keys().next().value;
			if (oldest) this.snapshots.delete(oldest);
		}
		this.snapshots.set(id, json);
	}

	restore(id: string, workbook: SpreadWorkbook): boolean {
		const snapshot = this.snapshots.get(id);
		if (!snapshot) return false;
		workbook.suspendPaint();
		workbook.fromJSON(snapshot);
		workbook.resumePaint();
		this.snapshots.delete(id);
		return true;
	}

	has(id: string): boolean {
		return this.snapshots.has(id);
	}

	discard(id: string): void {
		this.snapshots.delete(id);
	}

	clear(): void {
		this.snapshots.clear();
	}

	get size(): number {
		return this.snapshots.size;
	}
}
