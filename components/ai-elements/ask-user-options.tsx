"use client";

import { memo, useState } from "react";
import { cn } from "@/lib/utils";

interface AskUserOptionsProps {
	question: string;
	options: string[];
	onSelect: (option: string) => void;
	/** 从历史记录恢复时，传入已选择的选项 */
	selectedOption?: string;
	/** 后续消息存在但未选中任何选项时禁用所有按钮（不高亮任何选项） */
	disabled?: boolean;
}

export const AskUserOptions = memo(function AskUserOptions({ question, options, onSelect, selectedOption, disabled }: AskUserOptionsProps) {
	const [selected, setSelected] = useState<string | null>(selectedOption ?? null);

	const handleSelect = (option: string) => {
		if (selected || disabled) return;
		setSelected(option);
		onSelect(option);
	};

	const isLocked = selected !== null || disabled;

	return (
		<div className="my-1.5 rounded-lg border border-border/50 p-3">
			<p className="mb-2.5 text-[13px]">{question}</p>
			<div className="flex flex-wrap gap-1.5">
				{options.map((option) => (
					<button
						key={option}
						type="button"
						disabled={!!isLocked}
						onClick={() => handleSelect(option)}
						className={cn(
							"rounded-md border px-3 py-1.5 text-[13px] transition-all duration-150",
							selected === option
								? "border-primary bg-primary/10 text-primary"
								: isLocked
									? "opacity-35 cursor-not-allowed"
									: "border-border/60 hover:border-primary/40 hover:bg-accent/50 cursor-pointer",
						)}
					>
						{option}
					</button>
				))}
			</div>
		</div>
	);
});
