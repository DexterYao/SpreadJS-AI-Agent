import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import type { ToolResult } from "@/lib/agent/types";

// ============================================================================
// HTML → 纯文本提取
// ============================================================================

/** 移除 script/style/nav/header/footer 等非内容标签 */
function removeNonContentTags(html: string): string {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<nav[\s\S]*?<\/nav>/gi, "")
		.replace(/<header[\s\S]*?<\/header>/gi, "")
		.replace(/<footer[\s\S]*?<\/footer>/gi, "")
		.replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
		.replace(/<svg[\s\S]*?<\/svg>/gi, "");
}

/** HTML 实体解码 */
function decodeEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/g, "'")
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/** 从 HTML 提取可读文本 */
function htmlToText(html: string): string {
	let text = removeNonContentTags(html);
	// 块级标签转换行
	text = text.replace(/<(br|p|div|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, "\n");
	// 移除所有 HTML 标签
	text = text.replace(/<[^>]*>/g, "");
	text = decodeEntities(text);
	// 压缩空白
	text = text.replace(/[ \t]+/g, " ");
	text = text.replace(/\n{3,}/g, "\n\n");
	return text.trim();
}

/** 提取页面标题 */
function extractTitle(html: string): string | null {
	const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	return match ? decodeEntities(match[1]).trim() : null;
}

// ============================================================================
// URL 抓取逻辑
// ============================================================================

interface FetchResult {
	url: string;
	title: string | null;
	content: string;
	contentLength: number;
	truncated: boolean;
}

async function fetchAndExtract(
	url: string,
	maxLength: number,
): Promise<ToolResult<FetchResult>> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15_000);

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
				"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
			},
			signal: controller.signal,
			redirect: "follow",
		});

		clearTimeout(timeout);

		if (!response.ok) {
			return { success: false, error: `HTTP ${response.status} ${response.statusText}` };
		}

		const contentType = response.headers.get("content-type") ?? "";
		const rawText = await response.text();

		let content: string;
		let title: string | null = null;

		if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
			title = extractTitle(rawText);
			content = htmlToText(rawText);
		} else {
			// 纯文本、JSON 等直接返回
			content = rawText;
		}

		const fullLength = content.length;
		const truncated = fullLength > maxLength;
		if (truncated) {
			content = content.slice(0, maxLength) + "\n\n[... 内容已截断]";
		}

		return {
			success: true,
			data: {
				url,
				title,
				content,
				contentLength: fullLength,
				truncated,
			},
		};
	} catch (e) {
		if (e instanceof DOMException && e.name === "AbortError") {
			return { success: false, error: "请求超时（15 秒）" };
		}
		return { success: false, error: e instanceof Error ? e.message : String(e) };
	}
}

// ============================================================================
// 工具定义
// ============================================================================

const inputSchema = z.object({
	url: z.url().describe("要读取的网页 URL，必须以 http:// 或 https:// 开头"),
	maxLength: z
		.number()
		.int()
		.min(500)
		.max(50000)
		.default(10000)
		.describe("返回内容的最大字符数，默认 10000"),
});

const fetchUrl: ToolDef<z.infer<typeof inputSchema>> = {
	name: "fetch_url",
	displayName: "读取网页",
	description:
		"读取指定 URL 的网页内容并提取纯文本。用于获取 web_search 返回的链接的详细内容。自动去除 HTML 标签、脚本、样式，返回可读文本。",
	inputSchema,
	execute: async (input) => {
		return fetchAndExtract(input.url, input.maxLength);
	},
};

export default fetchUrl;
