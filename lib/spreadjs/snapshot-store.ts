import { SnapshotStoreMemory } from "./snapshot-store-memory";
import { SnapshotStoreIdb } from "./snapshot-store-idb";

/** 内存快照 — execute_code 临时回滚用，最多 10 个 */
export const snapshotStore = new SnapshotStoreMemory(10);

/** IndexedDB 快照 — 消息级会话快照，最多 100 个 */
export const snapshotStoreIdb = new SnapshotStoreIdb(100);

export { SnapshotStoreMemory } from "./snapshot-store-memory";
export { SnapshotStoreIdb } from "./snapshot-store-idb";
