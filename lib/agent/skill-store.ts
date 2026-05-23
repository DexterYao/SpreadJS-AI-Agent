export interface SkillStep {
toolName: string;
purpose: string;
inputSummary?: string;
}

export interface Skill {
id: string;
name: string;
description: string;
steps: SkillStep[];
createdAt: number;
updatedAt: number;
}

const DB_NAME = "spreadjs-agent-skills";
const DB_VERSION = 1;
const STORE_NAME = "skills";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
if (dbPromise) return dbPromise;
dbPromise = new Promise((resolve, reject) => {
const req = indexedDB.open(DB_NAME, DB_VERSION);
req.onupgradeneeded = (e) => {
const db = (e.target as IDBOpenDBRequest).result;
if (!db.objectStoreNames.contains(STORE_NAME)) {
const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
store.createIndex("updatedAt", "updatedAt", { unique: false });
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

export async function saveSkill(skill: Skill): Promise<void> {
const db = await openDB();
const tx = db.transaction(STORE_NAME, "readwrite");
await promisify(tx.objectStore(STORE_NAME).put(skill));
}

export async function getSkill(id: string): Promise<Skill | undefined> {
const db = await openDB();
const tx = db.transaction(STORE_NAME, "readonly");
return promisify(tx.objectStore(STORE_NAME).get(id));
}

export async function deleteSkill(id: string): Promise<void> {
const db = await openDB();
const tx = db.transaction(STORE_NAME, "readwrite");
await promisify(tx.objectStore(STORE_NAME).delete(id));
}

export async function listSkills(): Promise<Skill[]> {
const db = await openDB();
const tx = db.transaction(STORE_NAME, "readonly");
const store = tx.objectStore(STORE_NAME);

return new Promise((resolve, reject) => {
const index = store.index("updatedAt");
const result: Skill[] = [];
const req = index.openCursor(null, "prev");
req.onsuccess = () => {
const cursor = req.result;
if (!cursor) {
resolve(result);
return;
}
result.push(cursor.value as Skill);
cursor.continue();
};
req.onerror = () => reject(req.error);
});
}

export function generateSkillId(): string {
return `skill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
