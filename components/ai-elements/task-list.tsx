"use client";

import { memo, useState } from "react";
import { useTasks } from "@/lib/agent/task-store";
import type { Task } from "@/lib/agent/task-types";
import {
	CheckCircle2Icon,
	CircleDotIcon,
	CircleIcon,
	ChevronDownIcon,
	ListTodoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<Task["status"], { icon: typeof CircleIcon; className: string }> = {
	pending: { icon: CircleIcon, className: "text-muted-foreground" },
	running: { icon: CircleDotIcon, className: "text-blue-500" },
	done: { icon: CheckCircle2Icon, className: "text-green-500" },
};

type OverallStatus = "pending" | "running" | "done";

function getOverallStatus(tasks: Task[]): OverallStatus {
	if (tasks.every((t) => t.status === "done")) return "done";
	if (tasks.some((t) => t.status === "running")) return "running";
	return "pending";
}

function getPreviewTask(tasks: Task[], overall: OverallStatus): Task | null {
	if (overall === "done") return null;
	if (overall === "running") return tasks.find((t) => t.status === "running") ?? null;
	return tasks.find((t) => t.status === "pending") ?? null;
}

function TaskItems({ tasks }: { tasks: Task[] }) {
	const overall = getOverallStatus(tasks);
	const previewTask = getPreviewTask(tasks, overall);
	const [isOpen, setIsOpen] = useState(false);

	const StatusIcon =
		overall === "done" ? CheckCircle2Icon : overall === "running" ? CircleDotIcon : CircleIcon;
	const statusIconClass =
		overall === "done"
			? "text-green-500"
			: overall === "running"
				? "text-blue-500 animate-pulse"
				: "text-muted-foreground";

	const PreviewIcon = previewTask ? statusConfig[previewTask.status].icon : null;
	const previewClass = previewTask ? statusConfig[previewTask.status].className : "";

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="group not-prose my-1.5 w-full rounded-lg border border-border/50"
		>
			<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2">
				<div className="flex min-w-0 items-center gap-2">
					<ListTodoIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
					<span className="text-[13px] font-medium">任务计划</span>
					<Badge className="gap-1 rounded-full text-[11px] font-normal" variant="secondary">
						<StatusIcon className={cn("size-3", statusIconClass)} />
						<span>
							{overall === "done" ? "已完成" : overall === "running" ? "进行中" : "待开始"}
						</span>
					</Badge>
				</div>
				<ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-150 group-data-[state=open]:rotate-180" />
			</CollapsibleTrigger>

			{/* 收起时的预览：仅显示当前进行中（或首个等待中）的任务 */}
			{!isOpen && previewTask && PreviewIcon && (
				<div className="border-t border-border/40 px-3 pb-2.5 pt-2">
					<div className={cn("flex items-center gap-2 text-[13px]", previewClass)}>
						<PreviewIcon
							className={cn(
								"size-3.5 shrink-0",
								previewTask.status === "running" && "animate-pulse",
							)}
						/>
						<span>{previewTask.label}</span>
					</div>
				</div>
			)}

			{/* 展开后显示全部任务 */}
			<CollapsibleContent>
				<div className="space-y-1 border-t border-border/40 px-3 pb-2.5 pt-2">
					{tasks.map((task) => {
						const config = statusConfig[task.status];
						const Icon = config.icon;
						return (
							<div
								key={task.id}
								className={cn("flex items-center gap-2 text-[13px]", config.className)}
							>
								<Icon
									className={cn(
										"size-3.5 shrink-0",
										task.status === "running" && "animate-pulse",
									)}
								/>
								<span className={cn(task.status === "done" && "line-through opacity-50")}>
									{task.label}
								</span>
							</div>
						);
					})}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

/** 实时任务列表（从 taskStore 读取最新状态） */
export const TaskList = memo(function TaskList() {
	const tasks = useTasks();
	if (tasks.length === 0) return null;
	return <TaskItems tasks={tasks} />;
});

/** 静态任务快照（从工具输出中读取历史状态） */
export const TaskListSnapshot = memo(function TaskListSnapshot({ tasks }: { tasks: Task[] }) {
	if (tasks.length === 0) return null;
	return <TaskItems tasks={tasks} />;
});
