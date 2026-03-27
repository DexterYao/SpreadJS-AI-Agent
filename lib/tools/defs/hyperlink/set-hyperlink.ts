import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import { resolveAddress } from "@/lib/spreadjs/utils";

const inputSchema = z.object({
	cellAddress: z.string().describe('单元格地址，如 "A1" 或 "Sheet1!B3"'),
	url: z.string().describe("链接地址（支持 http/https/mailto/sjs:// 等协议）"),
	tooltip: z.string().optional().describe("鼠标悬浮提示文本"),
	target: z.enum(["blank", "self", "parent", "top"]).optional()
		.describe("打开方式。blank=新窗口(默认), self=当前窗口, parent=父窗口, top=顶层窗口"),
	linkColor: z.string().optional().describe("链接颜色，如 #0066cc"),
	visitedLinkColor: z.string().optional().describe("已访问链接颜色"),
	drawUnderline: z.boolean().optional().describe("是否绘制下划线，默认 true"),
	sheetName: z.string().optional().describe("目标 sheet 名称，默认活动 sheet"),
});

const setHyperlink: ToolDef<z.infer<typeof inputSchema>> = {
	name: "set_hyperlink",
	displayName: "设置超链接",
	module: "hyperlink",
	description:
		"为单元格设置超链接。支持网页URL、邮件地址、工作簿内引用(sjs://Sheet2!A1:B2)。" +
		"\n示例：网页 → cellAddress='A1', url='https://example.com'" +
		"\n示例：工作簿内跳转 → cellAddress='A1', url='sjs://Sheet2!A1:B2'" +
		"\n示例：邮件 → cellAddress='A1', url='mailto:test@example.com'" +
		"\n如果单元格没有显示文本，会自动将 url 设为显示文本。",
	inputSchema,
	handler: async (workbook, input) => {
		const { setHyperlink: bridgeSet } = await import("@/lib/spreadjs/bridge/hyperlink");
		const addr = resolveAddress(input.cellAddress);
		return bridgeSet(workbook, input.sheetName ?? addr.sheetName, {
			row: addr.row,
			col: addr.col,
			url: input.url,
			tooltip: input.tooltip,
			target: input.target,
			linkColor: input.linkColor,
			visitedLinkColor: input.visitedLinkColor,
			drawUnderline: input.drawUnderline,
		});
	},
};

export default setHyperlink;
