"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchIcon, MessageSquareIcon, ChevronDownIcon, Trash2Icon, MoreHorizontalIcon, DownloadIcon, UploadIcon, FileWarningIcon, BugIcon } from "lucide-react";
import { type SessionSummary, listSessionSummaries, searchSessionSummaries, deleteSession, getSession, clearAllSessions, PAGE_SIZE } from "@/lib/agent/session-store";
import { SessionPreview } from "@/components/ai-elements/session-preview";
import { snapshotStore, snapshotStoreIdb } from "@/lib/spreadjs/snapshot-store";

interface SessionHistoryProps {
	currentSessionId: string;
	onSelectSession: (sessionId: string) => void;
	onNewSession: () => void;
	refreshTrigger?: number;
	onExportSession?: (sessionId: string) => void;
	/** 导入会话文件，失败时抛出 Error（由组件内 showError 展示） */
	onImportSession?: (file: File) => Promise<void>;
	onExportDiagnostic?: () => void;
}

export function SessionHistory({
	currentSessionId,
	onSelectSession,
	onNewSession,
	refreshTrigger,
	onExportSession,
	onImportSession,
	onExportDiagnostic,
}: SessionHistoryProps) {
	const [query, setQuery] = useState("");
	const [sessions, setSessions] = useState<SessionSummary[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isSearching = query.trim().length > 0;

	const showError = useCallback((msg: string) => {
		setErrorMsg(msg);
		if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
		errorTimerRef.current = setTimeout(() => setErrorMsg(null), 3000);
	}, []);

	useEffect(() => () => {
		if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
	}, []);

	const load = useCallback(async (q: string, off: number, replace: boolean) => {
		setLoading(true);
		try {
			const result = q.trim()
				? await searchSessionSummaries(q.trim(), off, PAGE_SIZE)
				: await listSessionSummaries(off, PAGE_SIZE);
			if (replace) {
				setSessions(result.sessions);
			} else {
				setSessions((prev) => [...prev, ...result.sessions]);
			}
			setTotal(result.total);
			setOffset(off + result.sessions.length);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		setSessions([]);
		setOffset(0);
		load(query, 0, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshTrigger]);

	useEffect(() => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(() => {
			setSessions([]);
			setOffset(0);
			load(query, 0, true);
		}, 300);
		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	const handleLoadMore = () => { load(query, offset, false); };

	const handleDelete = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		const session = await getSession(id);
		await deleteSession(id);
		if (session?.snapshotMap) {
			const snapshotIds = Object.values(session.snapshotMap);
			snapshotStoreIdb.discardMany(snapshotIds).catch(() => {});
		}
		setSessions((prev) => prev.filter((s) => s.id !== id));
		setTotal((t) => t - 1);
		if (id === currentSessionId) onNewSession();
	};

	const handleClearAll = async () => {
		setMenuOpen(false);
		await clearAllSessions();
		snapshotStoreIdb.clear().catch(() => {});
		snapshotStore.clear();
		setSessions([]);
		setTotal(0);
		onNewSession();
	};

	const handleExport = useCallback((e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		onExportSession?.(id);
	}, [onExportSession]);

	const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";
		setMenuOpen(false);
		try {
			await onImportSession?.(file);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "导入失败，请检查文件格式";
			showError(msg);
		}
	}, [onImportSession, showError]);	useEffect(() => {
		if (!menuOpen) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				menuRef.current && !menuRef.current.contains(target) &&
				triggerRef.current && !triggerRef.current.contains(target)
			) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [menuOpen]);

	const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
	const [previewAnchor, setPreviewAnchor] = useState<{ left: number; top: number } | null>(null);
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => { return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }; }, []);

	const handleHoverPreview = useCallback((id: string, anchor: { left: number; top: number }) => {
		if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
		setPreviewSessionId(id);
		setPreviewAnchor(anchor);
	}, []);

	const handleLeavePreview = useCallback(() => {
		hideTimerRef.current = setTimeout(() => setPreviewSessionId(null), 300);
	}, []);

	const handlePreviewEnter = useCallback(() => {
		if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
	}, []);

	const handlePreviewLeave = useCallback(() => { setPreviewSessionId(null); }, []);

	const hasMore = sessions.length < total;

	return (
		<div className="flex flex-col h-full bg-background relative">
			<input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

			<div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
				<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">会话历史</span>
				<button
					ref={triggerRef}
					type="button"
					onClick={() => {
						if (menuOpen) { setMenuOpen(false); return; }
						const rect = triggerRef.current?.getBoundingClientRect();
						if (rect) setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
						setMenuOpen(true);
					}}
					className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
					title="更多操作"
				>
					<MoreHorizontalIcon className="size-3.5" />
				</button>
				{menuOpen && menuPos && (
					<div ref={menuRef} className="fixed z-50 w-max rounded-md border border-border bg-popover py-1 shadow-lg" style={{ top: menuPos.top, right: menuPos.right }}>
						{onImportSession && (
							<button type="button" onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors whitespace-nowrap w-full">
								<UploadIcon className="size-3 flex-shrink-0" />导入会话
							</button>
						)}
						{onExportSession && (
							<button type="button" onClick={() => { setMenuOpen(false); onExportSession(currentSessionId); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors whitespace-nowrap w-full">
								<DownloadIcon className="size-3 flex-shrink-0" />导出当前会话
							</button>
						)}
						{onExportDiagnostic && (
							<button type="button" onClick={() => { setMenuOpen(false); onExportDiagnostic(); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors whitespace-nowrap w-full">
								<BugIcon className="size-3 flex-shrink-0" />导出诊断包
							</button>
						)}
						<div className="my-1 border-t border-border/50" />
						<button type="button" onClick={handleClearAll} className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-accent transition-colors whitespace-nowrap w-full">
							<Trash2Icon className="size-3 flex-shrink-0" />清除全部历史
						</button>
					</div>
				)}
			</div>

			{errorMsg && (
				<div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border-b border-destructive/20">
					<FileWarningIcon className="size-3.5 shrink-0 text-destructive" />
					<span className="text-xs text-destructive flex-1 leading-snug">{errorMsg}</span>
				</div>
			)}

			<div className="px-3 py-2 border-b border-border/40">
				<div className="relative">
					<SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
					<input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索会话..." className="w-full rounded-md border border-border/60 bg-muted/30 pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40" />
				</div>
			</div>

			<div className="flex-1 overflow-y-auto chat-scrollbar">
				{sessions.length === 0 && !loading ? (
					<div className="flex flex-col items-center justify-center h-24 text-xs text-muted-foreground/60 gap-1">
						<MessageSquareIcon className="size-4" />
						{isSearching ? "无匹配结果" : "暂无会话历史"}
					</div>
				) : (
					<ul className="py-1">
						{sessions.map((s) => (
							<SessionItem
								key={s.id}
								session={s}
								isActive={s.id === currentSessionId}
								onClick={() => onSelectSession(s.id)}
								onDelete={(e) => handleDelete(e, s.id)}
								onExport={onExportSession ? (e) => handleExport(e, s.id) : undefined}
								onHoverPreview={handleHoverPreview}
								onLeavePreview={handleLeavePreview}
							/>
						))}
					</ul>
				)}
				{loading && sessions.length > 0 && (
					<div className="flex justify-center py-2"><span className="text-xs text-muted-foreground/60">加载中...</span></div>
				)}
				{hasMore && !loading && (
					<button type="button" onClick={handleLoadMore} className="flex items-center justify-center gap-1 w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
						<ChevronDownIcon className="size-3.5" />展开更多（还有 {total - sessions.length} 条）
					</button>
				)}
			</div>

			{previewSessionId && previewAnchor && (
				<SessionPreview sessionId={previewSessionId} anchor={previewAnchor} onMouseEnter={handlePreviewEnter} onMouseLeave={handlePreviewLeave} />
			)}
		</div>
	);
}
interface SessionItemProps {
	session: SessionSummary;
	isActive: boolean;
	onClick: () => void;
	onDelete: (e: React.MouseEvent) => void;
	onExport?: (e: React.MouseEvent) => void;
	onHoverPreview: (sessionId: string, anchor: { left: number; top: number }) => void;
	onLeavePreview: () => void;
}

function SessionItem({ session, isActive, onClick, onDelete, onExport, onHoverPreview, onLeavePreview }: SessionItemProps) {
	const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const itemRef = useRef<HTMLDivElement>(null);

	useEffect(() => { return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }; }, []);

	const handleMouseEnter = useCallback(() => {
		hoverTimerRef.current = setTimeout(() => {
			const rect = itemRef.current?.getBoundingClientRect();
			if (rect) onHoverPreview(session.id, { left: rect.left, top: rect.top });
		}, 500);
	}, [session.id, onHoverPreview]);

	const handleMouseLeave = useCallback(() => {
		if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
		onLeavePreview();
	}, [onLeavePreview]);

	const date = new Date(session.updatedAt);
	const now = new Date();
	const isToday = date.toDateString() === now.toDateString();
	const timeStr = isToday
		? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
		: date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });

	return (
		<li>
			<div
				ref={itemRef}
				role="button"
				tabIndex={0}
				onClick={onClick}
				onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				className={`group relative w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/50 cursor-pointer ${
					isActive ? "bg-primary/8 border-r-2 border-primary" : ""
				}`}
			>
				<MessageSquareIcon className={`size-3.5 mt-0.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
				<div className="flex-1 min-w-0">
					<p className={`text-xs font-medium truncate leading-tight ${isActive ? "text-primary" : "text-foreground"}`}>
						{session.title}
					</p>
					<p className="text-[10px] text-muted-foreground/50 mt-0.5">{timeStr}</p>
				</div>
				<div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-all">
					{onExport && (
						<button type="button" onClick={onExport} className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-accent transition-all" title="导出会话">
							<DownloadIcon className="size-3" />
						</button>
					)}
					<button type="button" onClick={onDelete} className="rounded p-0.5 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all" title="删除会话">
						<Trash2Icon className="size-3" />
					</button>
				</div>
			</div>
		</li>
	);
}