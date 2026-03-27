"use client";

import {
	SparklesIcon,
	TableIcon,
	BarChart3Icon,
	WandSparklesIcon,
	FileUpIcon,
} from "lucide-react";

const CAPABILITIES = [
	{ icon: TableIcon, label: "数据读写" },
	{ icon: WandSparklesIcon, label: "格式美化" },
	{ icon: BarChart3Icon, label: "图表分析" },
	{ icon: FileUpIcon, label: "文件导入" },
];

const STARTER_PROMPTS = [
	{ icon: TableIcon, label: "读取当前数据并生成统计摘要", prompt: "读取当前工作表的数据，生成统计摘要（行数、列数、数值列的合计/均值/最大最小值）" },
	{ icon: WandSparklesIcon, label: "将选中区域设为专业商务样式", prompt: "将选中区域设为专业商务样式（表头加粗、隔行着色、边框）" },
	{ icon: BarChart3Icon, label: "根据当前数据创建合适的图表", prompt: "分析当前数据，选择最合适的图表类型并创建" },
];

interface EmptyStateProps {
	onSend: (text: string) => void;
	isReady: boolean;
}

export function EmptyState({ onSend, isReady }: EmptyStateProps) {
	return (
		<div className="flex size-full flex-col items-center justify-center gap-5 px-6 py-8">
			<div className="flex flex-col items-center gap-2">
				<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
					<SparklesIcon className="size-5 text-primary/80" />
				</div>
				<h3 className="text-[15px] font-semibold">SpreadJS AI 助手</h3>
				<p className="text-center text-[13px] text-muted-foreground/80">
					用自然语言操作电子表格
				</p>
			</div>

			{/* 能力标签 */}
			<div className="flex flex-wrap justify-center gap-1.5">
				{CAPABILITIES.map(({ icon: Icon, label }) => (
					<span
						key={label}
						className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-0.5 text-[11px] text-muted-foreground/70"
					>
						<Icon className="size-3" />
						{label}
					</span>
				))}
			</div>

			{/* Starter prompts */}
			<div className="flex w-full flex-col gap-1.5">
				{STARTER_PROMPTS.map(({ icon: Icon, label, prompt }) => (
					<button
						key={label}
						type="button"
						disabled={!isReady}
						onClick={() => onSend(prompt)}
						className="group flex items-center gap-3 rounded-lg border border-border/50 px-3.5 py-2.5 text-left text-[13px] transition-all hover:border-border hover:bg-accent/40 disabled:opacity-50"
					>
						<Icon className="size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary/70" />
						<span className="text-foreground/90">{label}</span>
					</button>
				))}
			</div>
		</div>
	);
}
