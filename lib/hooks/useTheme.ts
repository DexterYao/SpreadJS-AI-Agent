"use client";

import { useEffect } from "react";
import type { ThemeMode } from "./useSettings";

const DESIGNER_LIGHT_CSS_ID = "spreadjs-designer-light-theme";
const DESIGNER_LIGHT_CSS_HREF = "/spreadjs/gc.spread.sheets.designer.light.min.css";
const DESIGNER_DARK_CSS_ID = "spreadjs-designer-dark-theme";
const DESIGNER_DARK_CSS_HREF = "/spreadjs/gc.spread.sheets.designer.dark.min.css";
const RUNTIME_LIGHT_CSS_ID = "spreadjs-runtime-light-theme";
const RUNTIME_LIGHT_CSS_HREF = "/spreadjs/gc.spread.sheets.excel2013white.css";
const RUNTIME_DARK_CSS_ID = "spreadjs-runtime-dark-theme";
const RUNTIME_DARK_CSS_HREF = "/spreadjs/gc.spread.sheets.excel2016black.css";

/** 拥有 refresh() 方法的对象（SpreadJS Workbook） */
type Refreshable = { refresh(): void };

function resolveIsDark(mode: ThemeMode): boolean {
	if (mode === "system") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	}
	return mode === "dark";
}

function applyThemeClass(mode: ThemeMode, onRuntimeLoaded?: () => void) {
	const isDark = resolveIsDark(mode);
	document.documentElement.classList.toggle("dark", isDark);
	applyExclusiveCss(
		isDark,
		DESIGNER_LIGHT_CSS_ID, DESIGNER_LIGHT_CSS_HREF,
		DESIGNER_DARK_CSS_ID, DESIGNER_DARK_CSS_HREF,
	);
	applyExclusiveCss(
		isDark,
		RUNTIME_LIGHT_CSS_ID, RUNTIME_LIGHT_CSS_HREF,
		RUNTIME_DARK_CSS_ID, RUNTIME_DARK_CSS_HREF,
		onRuntimeLoaded,
	);
}

/** light/dark 互斥切换：移除非活动主题，注入活动主题，确保只有一套 CSS 生效 */
function applyExclusiveCss(
	isDark: boolean,
	lightId: string, lightHref: string,
	darkId: string, darkHref: string,
	onLoaded?: () => void,
) {
	const activeId = isDark ? darkId : lightId;
	const activeHref = isDark ? darkHref : lightHref;
	const inactiveId = isDark ? lightId : darkId;

	document.getElementById(inactiveId)?.remove();

	if (!document.getElementById(activeId)) {
		const link = document.createElement("link");
		link.id = activeId;
		link.rel = "stylesheet";
		link.href = activeHref;
		if (onLoaded) link.onload = () => onLoaded();
		document.head.appendChild(link);
	} else if (onLoaded) {
		onLoaded();
	}
}

/**
 * 根据 theme 设置值，将 .dark 类应用到 <html> 上，
 * 同时切换 SpreadJS Designer 和 Runtime 的 CSS 主题，
 * 并监听系统主题变化（当 mode 为 "system" 时）。
 *
 * @param spreadHost - 可选，SpreadJS Workbook 实例。切换 Runtime CSS 后需调用
 *   workbook.refresh() 让 SpreadJS 重新读取样式并重绘画布。
 */
export function useTheme(mode: ThemeMode, spreadHost?: Refreshable | null) {
	useEffect(() => {
		const refresh = () => spreadHost?.refresh();
		applyThemeClass(mode, refresh);

		if (mode !== "system") return;

		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => applyThemeClass("system", refresh);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [mode, spreadHost]);
}
