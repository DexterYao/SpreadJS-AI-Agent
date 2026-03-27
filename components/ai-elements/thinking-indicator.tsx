"use client";

export function ThinkingIndicator({ label }: { label?: string }) {
	return (
		<div className="flex items-center gap-2.5 py-1">
			<div className="flex items-center gap-[3px]">
				<span className="thinking-dot size-[5px] rounded-full bg-muted-foreground/50" />
				<span className="thinking-dot size-[5px] rounded-full bg-muted-foreground/50 [animation-delay:160ms]" />
				<span className="thinking-dot size-[5px] rounded-full bg-muted-foreground/50 [animation-delay:320ms]" />
			</div>
			{label && <span className="text-xs text-muted-foreground/80">{label}</span>}
		</div>
	);
}
