export interface Task {
	id: string;
	label: string;
	status: "pending" | "running" | "done";
}

/** 一次 add_tasks 调用产生的任务计划 */
export interface TaskPlan {
	planId: string;
	tasks: Task[];
	createdAt: number;
}
