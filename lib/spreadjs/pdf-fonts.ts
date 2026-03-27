/**
 * PDF 导出中文字体注册
 *
 * SpreadJS 的 PDF 导出仅内置 14 种标准西文字体，中文会乱码。
 * 需要在 savePDF 之前通过 PDFFontsManager.registerFont() 注册中文字体。
 *
 * 字体文件放置于 public/fonts/，格式为 .ttf。
 * 首次 PDF 导出时按需加载，之后复用。
 */
import GC from "@grapecity-software/spread-sheets";

/** 需要注册的字体列表（name → 文件路径映射） */
const FONT_MAP: Record<string, { normal: string; bold?: string }> = {
	"微软雅黑": { normal: "/fonts/msyh.ttf", bold: "/fonts/msyhbd.ttf" },
	"宋体": { normal: "/fonts/simsun.ttf" },
	"SimSun": { normal: "/fonts/simsun.ttf" },
	"Microsoft YaHei": { normal: "/fonts/msyh.ttf", bold: "/fonts/msyhbd.ttf" },
};

let registered = false;
let registering: Promise<void> | null = null;

async function fetchFontAsArrayBuffer(url: string): Promise<ArrayBuffer | null> {
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		return await res.arrayBuffer();
	} catch {
		return null;
	}
}

async function doRegister(): Promise<void> {
	const manager = GC.Spread.Sheets.PDF?.PDFFontsManager;
	if (!manager) {
		console.warn("[pdf-fonts] PDFFontsManager 不可用，跳过字体注册");
		return;
	}

	const entries = Object.entries(FONT_MAP);
	const results = await Promise.allSettled(
		entries.map(async ([name, paths]) => {
			const fonts: Record<string, ArrayBuffer> = {};
			const normal = await fetchFontAsArrayBuffer(paths.normal);
			if (!normal) return; // 字体文件不存在，跳过
			fonts.normal = normal;

			if (paths.bold) {
				const bold = await fetchFontAsArrayBuffer(paths.bold);
				if (bold) fonts.bold = bold;
			}

			manager.registerFont(name, fonts);
		}),
	);

	const successCount = results.filter(r => r.status === "fulfilled").length;
	if (successCount > 0) {
		console.log(`[pdf-fonts] 注册 ${successCount}/${entries.length} 个字体`);
	} else {
		console.warn("[pdf-fonts] 未找到任何字体文件（public/fonts/），PDF 中文可能乱码");
	}
}

/** 确保中文字体已注册，多次调用只执行一次 */
export async function ensurePdfFonts(): Promise<void> {
	if (registered) return;
	if (!registering) {
		registering = doRegister().then(() => { registered = true; });
	}
	await registering;
}
