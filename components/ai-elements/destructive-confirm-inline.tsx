"use client";

import { memo } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConfirmDialogState, ConfirmChoice } from "@/lib/hooks/useDestructiveGuard";

/** 每个工具对应的操作确认文案 */
const TOOL_LABELS: Record<string, { once: string; sameType: string }> = {
	write_data:       { once: "确认覆盖",   sameType: "确认覆盖且后续写入数据不再确认"   },
	set_cell:         { once: "确认写入",   sameType: "确认写入且后续写入单元格不再确认"  },
	auto_fill:        { once: "确认填充",   sameType: "确认填充且后续自动填充不再确认"    },
	clear_cells:      { once: "确认清除",   sameType: "确认清除且后续清除单元格不再确认"  },
	delete_rows_cols: { once: "确认删除",   sameType: "确认删除且后续删除行列不再确认"    },
	find_and_replace: { once: "确认替换",   sameType: "确认替换且后续查找替换不再确认"    },
	merge_cells:      { once: "确认合并",   sameType: "确认合并且后续合并单元格不再确认"  },
};

const FALLBACK_LABELS = { once: "确认操作", sameType: "确认操作且后续此操作不再确认" };

interface DestructiveConfirmInlineProps {
	dialog: ConfirmDialogState | null;
	onChoice: (choice: ConfirmChoice) => void;
}

export const DestructiveConfirmInline = memo(function DestructiveConfirmInline({
	dialog,
	onChoice,
}: DestructiveConfirmInlineProps) {
	if (!dialog) return null;

	const labels = TOOL_LABELS[dialog.toolName] ?? FALLBACK_LABELS;

	return (
		<div className="mx-1 mb-2 rounded-lg border border-amber-200/70 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-950/20 px-3 py-2.5">
			<div className="flex items-start gap-2 mb-2">
				<AlertTriangleIcon className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
				<div className="flex-1 min-w-0">
					<p className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-tight">
						{dialog.title}
					</p>
					<p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5 leading-relaxed">
						{dialog.description}
					</p>
				</div>
			</div>
			<div className="flex flex-col gap-1.5 pl-5">
				<div className="flex gap-1.5">
					<Button
						size="sm"
						variant="default"
						className="h-6 text-xs px-2.5"
						onClick={() => onChoice("once")}
					>
						{labels.once}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-6 text-xs px-2.5 text-muted-foreground"
						onClick={() => onChoice("cancel")}
					>
						取消
					</Button>
				</div>
				<Button
					size="sm"
					variant="outline"
					className="h-6 text-xs px-2.5 self-start"
					onClick={() => onChoice("same-type")}
				>
					{labels.sameType}
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="h-6 text-xs px-2.5 self-start"
					onClick={() => onChoice("all")}
				>
					确认操作且后续所有操作不再确认
				</Button>
			</div>
		</div>
	);
});

