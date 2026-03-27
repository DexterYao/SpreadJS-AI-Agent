"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/** 用户在确认弹窗中的选择 */
export type ConfirmChoice = "once" | "same-type" | "all" | "cancel";

export interface ConfirmRequest {
	toolName: string;
	title: string;
	description: string;
}

export interface ConfirmDialogState extends ConfirmRequest {
	open: boolean;
}

export interface UseDestructiveGuardReturn {
	confirmDialog: ConfirmDialogState | null;
	/** 请求用户确认。若已被绕过或全局允许，直接 resolve true；否则弹出弹窗挂起等待 */
	requestConfirm: (params: ConfirmRequest) => Promise<boolean>;
	/** 弹窗按钮点击回调，更新 bypass 状态并 resolve 挂起的 Promise */
	onConfirmChoice: (choice: ConfirmChoice) => void;
}

/**
 * 会话级破坏性操作确认守卫。
 *
 * - bypassGlobal / bypassTools 存储在 ref 中（不触发重渲染）
 * - same-type bypass 以工具名称为粒度（同一工具的后续调用不再确认）
 * - confirmDialog 状态驱动内联提示 UI
 * - allowAll 来自持久化设置，实时通过 ref 读取
 */
export function useDestructiveGuard(allowAll: boolean): UseDestructiveGuardReturn {
	const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

	// 始终保持最新 allowAll 值（来自 settings），requestConfirm 可以是 stable ref
	const allowAllRef = useRef(allowAll);
	useEffect(() => {
		allowAllRef.current = allowAll;
	}, [allowAll]);

	// 会话级 bypass 状态（不需要触发渲染，用 ref）
	const bypassGlobalRef = useRef(false);
	const bypassToolsRef = useRef(new Set<string>());

	// 当前弹窗对应的待确认工具名（用于 same-type bypass）
	const pendingToolRef = useRef<string | null>(null);
	// 当前挂起的 Promise resolve
	const pendingResolveRef = useRef<((result: boolean) => void) | null>(null);

	const requestConfirm = useCallback((params: ConfirmRequest): Promise<boolean> => {
		// 全局设置允许 → 直接通过
		if (allowAllRef.current) return Promise.resolve(true);
		// 会话级全局 bypass → 直接通过
		if (bypassGlobalRef.current) return Promise.resolve(true);
		// 同工具 bypass → 直接通过
		if (bypassToolsRef.current.has(params.toolName)) return Promise.resolve(true);

		// 挂起等待用户确认
		return new Promise<boolean>((resolve) => {
			pendingResolveRef.current = resolve;
			pendingToolRef.current = params.toolName;
			setConfirmDialog({ ...params, open: true });
		});
	}, []); // 无外部依赖，stable 引用

	const onConfirmChoice = useCallback((choice: ConfirmChoice) => {
		const resolve = pendingResolveRef.current;
		const tool = pendingToolRef.current;

		pendingResolveRef.current = null;
		pendingToolRef.current = null;
		setConfirmDialog(null);

		if (!resolve) return;

		switch (choice) {
			case "cancel":
				resolve(false);
				break;
			case "once":
				resolve(true);
				break;
			case "same-type":
				if (tool) bypassToolsRef.current.add(tool);
				resolve(true);
				break;
			case "all":
				bypassGlobalRef.current = true;
				resolve(true);
				break;
		}
	}, []);

	return { confirmDialog, requestConfirm, onConfirmChoice };
}
