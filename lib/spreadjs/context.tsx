"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { SpreadWorkbook } from "@/lib/agent/types";

interface SpreadJSContextValue {
	workbook: SpreadWorkbook | null;
	setWorkbook: (wb: SpreadWorkbook) => void;
	isReady: boolean;
}

const SpreadJSContext = createContext<SpreadJSContextValue | null>(null);

export function SpreadJSProvider({ children }: { children: ReactNode }) {
	const workbookRef = useRef<SpreadWorkbook | null>(null);
	const [isReady, setIsReady] = useState(false);

	const setWorkbook = useCallback((wb: SpreadWorkbook) => {
		workbookRef.current = wb;
		setIsReady(true);
	}, []);

	const contextValue = useMemo(() => ({
		get workbook() { return workbookRef.current; },
		setWorkbook,
		isReady,
	}), [setWorkbook, isReady]);

	return (
		<SpreadJSContext value={contextValue}>
			{children}
		</SpreadJSContext>
	);
}

export function useSpreadJS(): SpreadJSContextValue {
	const ctx = useContext(SpreadJSContext);
	if (!ctx) throw new Error("useSpreadJS 必须在 SpreadJSProvider 内使用");
	return ctx;
}
