import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import type { CompleteTaskInput, CompleteTaskOutputData } from "@/lib/agent/ui-message";

const inputSchema = z.object({
	taskId: z.string().describe("要标记完成的任务 ID，必须与 add_tasks 中定义的 id 一致"),
});

const completeTask: ToolDef<CompleteTaskInput, CompleteTaskOutputData> = {
	name: "complete_task",
	displayName: "完成任务",
	description:
		"标记指定任务为已完成。完成后自动将下一个 pending 任务标记为 running。配合 add_tasks 使用。",
	inputSchema,
	handler: async (_workbook, input) => {
		const { taskStore } = await import("@/lib/agent/task-store");
		const before = taskStore.getSnapshot();
		const target = before.find((t) => t.id === input.taskId);
		if (!target) {
			return {
				success: false,
				error: `任务 "${input.taskId}" 不存在。当前任务: ${before.map((t) => t.id).join(", ") || "无"}`,
			};
		}
		if (target.status === "done") {
			return {
				success: false,
				error: `任务 "${input.taskId}" 已完成，无需重复标记`,
			};
		}
		taskStore.completeTask(input.taskId);
		const snapshot = taskStore.getSnapshot();
		const next = snapshot.find((t) => t.status === "running");
		return {
			success: true,
			data: {
				planId: taskStore.getLatestPlanId(),
				completedTaskId: input.taskId,
				nextTask: next ? `${next.id}: ${next.label}` : null,
				remaining: snapshot.filter((t) => t.status !== "done").length,
				tasks: snapshot.map((t) => ({ id: t.id, label: t.label, status: t.status })),
			},
		};
	},
};

export default completeTask;
