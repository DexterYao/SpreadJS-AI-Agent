"use client";

import { memo, useState, useEffect, useRef } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronRightIcon } from "lucide-react";
import { MessageResponse } from "./message";

interface ReasoningBlockProps {
	text: string;
	state?: "streaming" | "done";
	interrupted?: boolean;
}

/** 清理 extractReasoningMiddleware 残留的 <think>/<\/think> 标签 */
function stripThinkTags(s: string): string {
	return s.replace(/<\/?think>/gi, "");
}

export const ReasoningBlock = memo(function ReasoningBlock({ text: rawText, state, interrupted }: ReasoningBlockProps) {
	const text = stripThinkTags(rawText);
	const isStreaming = state === "streaming";

	// 用户手动控制的展开/折叠状态
	// interrupted remount 时初始折叠，其余阶段初始展开
	const [open, setOpen] = useState(() => !interrupted);

	// 记录自动折叠是否已触发，避免重复触发
	const hasAutoCollapsed = useRef(false);

	// 完成后 1 秒自动折叠（仅触发一次，且仅在用户未手动操作时）
	useEffect(() => {
		if (state === "done" && !interrupted && !hasAutoCollapsed.current) {
			const timer = setTimeout(() => {
				setOpen(false);
				hasAutoCollapsed.current = true;
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [state, interrupted]);

	if (!text) return null;

	const triggerLabel = interrupted
		? "思考已中断"
		: isStreaming
		? "思考中..."
		: "思考过程";

	return (
		<Collapsible
			open={open}
			onOpenChange={(next) => {
				// 用户手动操作：标记已手动折叠/展开，阻止后续自动折叠覆盖
				hasAutoCollapsed.current = true;
				setOpen(next);
			}}
			className="group/reasoning w-full"
		>
			<CollapsibleTrigger className="flex items-center gap-1.5 py-0.5 text-xs text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors">
				<BrainIcon className={cn("size-3 shrink-0", isStreaming && !interrupted && "animate-pulse")} />
				<span className={cn(interrupted && "text-amber-600/70")}>{triggerLabel}</span>
				<span
					className={cn(
						"size-1.5 rounded-full",
						interrupted
							? "bg-amber-500/40"
							: isStreaming
							? "bg-amber-400/80 animate-pulse"
							: "bg-muted-foreground/25",
					)}
					aria-hidden="true"
				/>
				{/* 流式期间不显示展开箭头，避免视觉混乱 */}
				{!isStreaming && (
					<ChevronRightIcon
						className={cn(
							"size-3 shrink-0 transition-transform duration-150",
							open && "rotate-90",
						)}
					/>
				)}
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-1 border-l-2 border-border/40 pl-3">
					<div
						className="max-h-40 overflow-y-auto chat-scrollbar text-xs text-muted-foreground/70 leading-relaxed"
						tabIndex={0}
						role="region"
						aria-label="推理内容"
					>
						{isStreaming ? (
							<pre className="whitespace-pre-wrap font-sans">{text}</pre>
						) : (
							<MessageResponse>{text}</MessageResponse>
						)}
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
});

export interface ReasoningPartData {
	text: string;
	state?: "streaming" | "done";
}
