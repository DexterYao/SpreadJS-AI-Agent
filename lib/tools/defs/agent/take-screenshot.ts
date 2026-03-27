import { z } from "zod/v4";
import type { ToolDef } from "../../types";

const inputSchema = z.object({
	reason: z
		.string()
		.describe("说明为什么需要截图来辅助理解（必须涉及复杂视觉布局分析）"),
});

const takeScreenshot: ToolDef<z.infer<typeof inputSchema>> = {
	name: "take_screenshot",
	displayName: "截图分析",
	description: `捕获当前活动工作表的视觉截图，用于多模态模型理解复杂表格布局。

严格使用条件（必须全部满足）：
1. 需要理解单元格合并、嵌套表头、不规则布局等视觉结构
2. 仅靠 read_ranges 返回的文本数据无法判断布局关系
3. 任务涉及布局复制、格式模仿、或视觉对齐分析

禁止使用的场景：
- 普通数据读写、公式计算、排序筛选等不涉及视觉布局的操作
- read_ranges 已能提供足够信息时
- 仅为了"看看数据长什么样"

调用前必须填写 reason 说明布局分析需求。截图返回 PNG 图片供视觉分析。`,
	inputSchema,
	handler: async (workbook, input) => {
		void input;
		const { takeScreenshot: capture } = await import(
			"@/lib/spreadjs/bridge/io/take-screenshot"
		);
		return capture(workbook);
	},
};

export default takeScreenshot;
