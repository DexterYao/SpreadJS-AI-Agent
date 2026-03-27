import { useState, useRef, useCallback, useEffect } from "react";
import { CHAT_PANEL_WIDTH } from "@/lib/config";

const MIN_WIDTH = 320;
const STORAGE_KEY = "spreadjs-agent-panel-width";

function getMaxWidth() {
	return Math.floor(window.innerWidth / 2);
}

function loadWidth(): number {
	if (typeof window === "undefined") return CHAT_PANEL_WIDTH;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const parsed = parseInt(saved, 10);
			if (!isNaN(parsed) && parsed >= MIN_WIDTH) {
				return Math.min(parsed, getMaxWidth());
			}
		}
	} catch {
		/* ignore */
	}
	return CHAT_PANEL_WIDTH;
}

/**
 * 管理 Chat Panel 可拖拽调整宽度的逻辑。
 * mousedown 绑定到 handle 元素，mousemove/mouseup 绑定到 window（防止拖快时丢失事件）。
 * 宽度值持久化到 localStorage，刷新后恢复。
 */
export function useResizablePanel() {
	const [width, setWidth] = useState(CHAT_PANEL_WIDTH);

	// hydration 后从 localStorage 恢复宽度，避免 SSR mismatch
	const hydrated = useRef(false);
	useEffect(() => {
		let frame = 0;
		if (!hydrated.current) {
			hydrated.current = true;
			const saved = loadWidth();
			if (saved !== CHAT_PANEL_WIDTH) {
				// Defer to the next frame so hydration stays stable without a
				// synchronous effect-driven state update.
				frame = window.requestAnimationFrame(() => {
					setWidth(saved);
				});
			}
		}
		return () => {
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, []);
	const [dragging, setDragging] = useState(false);
	const startX = useRef(0);
	const startWidth = useRef(0);

	const onMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			startX.current = e.clientX;
			startWidth.current = width;
			setDragging(true);
		},
		[width],
	);

	useEffect(() => {
		if (!dragging) return;

		const onMouseMove = (e: MouseEvent) => {
			const delta = startX.current - e.clientX;
			const next = Math.min(getMaxWidth(), Math.max(MIN_WIDTH, startWidth.current + delta));
			setWidth(next);
		};

		const onMouseUp = () => {
			setDragging(false);
		};

		document.body.style.userSelect = "none";
		document.body.style.cursor = "col-resize";
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);

		return () => {
			document.body.style.userSelect = "";
			document.body.style.cursor = "";
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [dragging]);

	// 拖拽结束时持久化宽度
	const wasDragging = useRef(false);
	useEffect(() => {
		if (wasDragging.current && !dragging) {
			try {
				localStorage.setItem(STORAGE_KEY, String(width));
			} catch {
				/* quota exceeded etc. */
			}
		}
		wasDragging.current = dragging;
	}, [dragging, width]);

	/** 编程式设置宽度（设置面板调用），立即持久化 */
	const setWidthValue = useCallback((w: number) => {
		const clamped = Math.min(getMaxWidth(), Math.max(MIN_WIDTH, w));
		setWidth(clamped);
		try {
			localStorage.setItem(STORAGE_KEY, String(clamped));
		} catch { /* ignore */ }
	}, []);

	return {
		width,
		dragging,
		handleProps: { onMouseDown },
		setWidth: setWidthValue,
	};
}
