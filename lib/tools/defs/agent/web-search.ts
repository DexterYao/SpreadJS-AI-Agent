import { z } from "zod/v4";
import type { ToolDef } from "../../types";
import type { ToolResult } from "@/lib/agent/types";

// ============================================================================
// 搜索 Provider 抽象
// ============================================================================

interface SearchResult {
	title: string;
	url: string;
	snippet: string;
}

interface SearchResponse {
	answer?: string | null;
	results: SearchResult[];
}

type SearchProvider = (query: string, maxResults: number) => Promise<ToolResult<SearchResponse>>;

// ============================================================================
// DuckDuckGo HTML 端点 — 零成本、无 API Key
// ============================================================================

const duckDuckGoSearch: SearchProvider = async (query, maxResults) => {
	try {
		const params = new URLSearchParams({ q: query });
		const response = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept": "text/html",
				"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
			},
		});

		if (!response.ok) {
			return { success: false, error: `DuckDuckGo 请求失败: ${response.status}` };
		}

		const html = await response.text();
		const results = parseDuckDuckGoHTML(html, maxResults);

		return {
			success: true,
			data: { answer: null, results },
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : String(e) };
	}
};

/** 从 DuckDuckGo HTML 提取搜索结果 */
function parseDuckDuckGoHTML(html: string, maxResults: number): SearchResult[] {
	const results: SearchResult[] = [];

	// DuckDuckGo HTML 结果结构：
	// <a class="result__a" href="...">title</a>
	// <a class="result__snippet" href="...">snippet</a>
	const linkRegex = /<a\s+[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
	const snippetRegex = /<a\s+[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

	const links: Array<{ url: string; title: string }> = [];
	let match: RegExpExecArray | null;

	while ((match = linkRegex.exec(html)) !== null) {
		const rawUrl = match[1];
		const title = stripHTMLTags(match[2]).trim();

		// DuckDuckGo 通过重定向链接包装 URL
		const actualUrl = extractDDGUrl(rawUrl);
		if (actualUrl && title) {
			links.push({ url: actualUrl, title });
		}
	}

	const snippets: string[] = [];
	while ((match = snippetRegex.exec(html)) !== null) {
		snippets.push(stripHTMLTags(match[1]).trim());
	}

	for (let i = 0; i < Math.min(links.length, maxResults); i++) {
		results.push({
			title: links[i].title,
			url: links[i].url,
			snippet: (snippets[i] ?? "").slice(0, 200),
		});
	}

	return results;
}

/** 从 DuckDuckGo 重定向 URL 中提取目标地址 */
function extractDDGUrl(rawUrl: string): string | null {
	// 格式: //duckduckgo.com/l/?uddg=https%3A%2F%2F...&rut=...
	try {
		if (rawUrl.includes("uddg=")) {
			const url = new URL(rawUrl, "https://duckduckgo.com");
			const target = url.searchParams.get("uddg");
			return target || null;
		}
		// 直接链接
		if (rawUrl.startsWith("http")) return rawUrl;
		return null;
	} catch {
		return null;
	}
}

/** 移除 HTML 标签 */
function stripHTMLTags(html: string): string {
	return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
}

// ============================================================================
// Tavily Provider — 需要 API Key（付费）
// ============================================================================

const tavilySearch: SearchProvider = async (query, maxResults) => {
	const apiKey = process.env.TAVILY_API_KEY;
	if (!apiKey) {
		return { success: false, error: "未配置 TAVILY_API_KEY 环境变量" };
	}

	try {
		const response = await fetch("https://api.tavily.com/search", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				api_key: apiKey,
				query,
				max_results: maxResults,
				include_answer: true,
			}),
		});

		if (!response.ok) {
			return { success: false, error: `Tavily 请求失败: ${response.status}` };
		}

		const data = await response.json();
		const results = (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
			title: r.title,
			url: r.url,
			snippet: r.content?.slice(0, 200),
		}));

		return {
			success: true,
			data: { answer: data.answer ?? null, results },
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : String(e) };
	}
};

// ============================================================================
// Provider 自动选择：有 TAVILY_API_KEY 用 Tavily，否则 DuckDuckGo
// ============================================================================

function getProvider(): SearchProvider {
	if (process.env.TAVILY_API_KEY) return tavilySearch;
	return duckDuckGoSearch;
}

// ============================================================================
// 工具定义
// ============================================================================

const inputSchema = z.object({
	query: z.string().describe("搜索关键词"),
	maxResults: z.number().int().min(1).max(10).default(5).describe("最大返回结果数"),
});

const webSearch: ToolDef<z.infer<typeof inputSchema>> = {
	name: "web_search",
	displayName: "网络搜索",
	description:
		"搜索互联网获取外部数据，用于补充电子表格内容。返回摘要文本和来源链接，不是原始网页内容。适用场景：查询汇率、股价、统计数据等实时信息。",
	inputSchema,
	execute: async (input) => {
		const provider = getProvider();
		return provider(input.query, input.maxResults);
	},
};

export default webSearch;
