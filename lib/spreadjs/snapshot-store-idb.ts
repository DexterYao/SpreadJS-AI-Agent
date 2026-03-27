import type { SpreadWorkbook } from "@/lib/agent/types";

// ============================================================================
// IndexedDB 快照存储 — 用于消息级会话快照
// 内存中仅保留 ID 有序列表，真实数据存储在 IndexedDB 中。
// ============================================================================

const DB_NAME = "spreadjs-agent-snapshots";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";

interface SnapshotRecord {
	id: string;
	data: object;
	createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = (e) => {
			const db = (e.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "id" });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	return dbPromise;
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

/**
 * 基于 IndexedDB 的快照存储。
 * 内存中维护有序 ID 列表，真实 toJSON 数据存储在 IndexedDB 中。
 * 超出容量按 FIFO 淘汰最早的快照。
 */
export class SnapshotStoreIdb {
	/** 有序 ID 列表（插入顺序），用于 FIFO 淘汰 */
	private ids: string[] = [];
	private maxSnapshots: number;
	private ready: Promise<void>;

	constructor(maxSnapshots = 100) {
		this.maxSnapshots = maxSnapshots;
		this.ready = this.init();
	}

	/** 从 IndexedDB 加载所有快照 ID 到内存 */
	private async init(): Promise<void> {
		try {
			const db = await openDB();
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);
			const all: SnapshotRecord[] = await promisify(store.getAll());
			// 按创建时间排序，确保 FIFO 顺序正确
			all.sort((a, b) => a.createdAt - b.createdAt);
			this.ids = all.map((r) => r.id);
		} catch {
			this.ids = [];
		}
	}

	/** 等待初始化完成 */
	async whenReady(): Promise<void> {
		return this.ready;
	}

	/** 保存快照到 IndexedDB */
	async save(id: string, workbook: SpreadWorkbook): Promise<void> {
		await this.ready;
		// FIFO 淘汰
		while (this.ids.length >= this.maxSnapshots) {
			const oldest = this.ids.shift();
			if (oldest) await this.deleteFromDB(oldest);
		}
		const record: SnapshotRecord = {
			id,
			data: workbook.toJSON(),
			createdAt: Date.now(),
		};
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readwrite");
		await promisify(tx.objectStore(STORE_NAME).put(record));
		// 如果是重复 id，先移除旧位置
		const idx = this.ids.indexOf(id);
		if (idx !== -1) this.ids.splice(idx, 1);
		this.ids.push(id);
	}

	/** 从 IndexedDB 恢复快照到 workbook */
	async restore(id: string, workbook: SpreadWorkbook): Promise<boolean> {
		await this.ready;
		const record = await this.getFromDB(id);
		if (!record) return false;
		workbook.suspendPaint();
		workbook.fromJSON(record.data);
		workbook.resumePaint();
		return true;
	}

	/** 检查内存索引中是否存在该快照 ID */
	has(id: string): boolean {
		return this.ids.includes(id);
	}

	/** 删除指定快照 */
	async discard(id: string): Promise<void> {
		await this.ready;
		const idx = this.ids.indexOf(id);
		if (idx !== -1) this.ids.splice(idx, 1);
		await this.deleteFromDB(id);
	}

	/** 批量删除指定快照 */
	async discardMany(ids: string[]): Promise<void> {
		if (ids.length === 0) return;
		await this.ready;
		const idSet = new Set(ids);
		this.ids = this.ids.filter((id) => !idSet.has(id));
		try {
			const db = await openDB();
			const tx = db.transaction(STORE_NAME, "readwrite");
			const store = tx.objectStore(STORE_NAME);
			for (const id of ids) {
				store.delete(id);
			}
			await new Promise<void>((resolve, reject) => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
		} catch {
			// ignore
		}
	}

	/** 清空所有快照 */
	async clear(): Promise<void> {
		await this.ready;
		this.ids = [];
		try {
			const db = await openDB();
			const tx = db.transaction(STORE_NAME, "readwrite");
			await promisify(tx.objectStore(STORE_NAME).clear());
		} catch {
			// ignore
		}
	}

	get size(): number {
		return this.ids.length;
	}

	/** 获取所有快照 ID 的副本 */
	getIds(): string[] {
		return [...this.ids];
	}

	private async getFromDB(id: string): Promise<SnapshotRecord | undefined> {
		try {
			const db = await openDB();
			const tx = db.transaction(STORE_NAME, "readonly");
			return promisify(tx.objectStore(STORE_NAME).get(id));
		} catch {
			return undefined;
		}
	}

	private async deleteFromDB(id: string): Promise<void> {
		try {
			const db = await openDB();
			const tx = db.transaction(STORE_NAME, "readwrite");
			await promisify(tx.objectStore(STORE_NAME).delete(id));
		} catch {
			// ignore
		}
	}
}
