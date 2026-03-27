import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import type { AddTasksInput, AddTasksOutputData } from "@/lib/agent/ui-message";

const inputSchema = z.object({
	tasks: z.array(z.object({
		id: z.string().describe("任务唯一标识，如 task_1、task_2"),
		label: z.string().describe("任务描述"),
	})).min(1).describe("任务列表，按执行顺序排列"),
});

const addTasks: ToolDef<AddTasksInput, AddTasksOutputData> = {
	name: "add_tasks",
	displayName: "创建任务计划",
	description:
		"创建任务计划列表。复杂任务（4 步以上操作）应先用此工具规划步骤，再逐步执行。任务状态会注入到后续请求的上下文中，帮助你追踪进度。第一个任务自动标记为 running。",
	inputSchema,
	handler: async (_workbook, input) => {
		const { taskStore } = await import("@/lib/agent/task-store");
		taskStore.addTasks(input.tasks);
		const latestPlanId = taskStore.getLatestPlanId();
		return {
			success: true,
			data: {
				planId: latestPlanId,
				taskCount: input.tasks.length,
				tasks: taskStore.getSnapshot().map((t) => ({ id: t.id, label: t.label, status: t.status })),
			},
		};
	},
};

export default addTasks;
