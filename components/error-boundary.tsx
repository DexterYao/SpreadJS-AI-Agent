"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

interface Props {
	label: string;
	children: ReactNode;
}

interface State {
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack);
	}

	render() {
		if (!this.state.error) return this.props.children;

		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
				<AlertTriangleIcon className="size-8 text-destructive/70" />
				<h3 className="text-sm font-semibold">{this.props.label} 出错了</h3>
				<p className="max-w-xs text-xs text-muted-foreground">
					{this.state.error.message}
				</p>
				<button
					type="button"
					className="mt-1 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
					onClick={() => this.setState({ error: null })}
				>
					<RefreshCwIcon className="size-3" />
					重试
				</button>
			</div>
		);
	}
}
