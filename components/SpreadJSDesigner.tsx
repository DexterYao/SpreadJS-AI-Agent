"use client";

import GC from "@grapecity-software/spread-sheets";

// 功能模块
import "@grapecity-software/spread-sheets-shapes";
import "@grapecity-software/spread-sheets-charts";
import "@grapecity-software/spread-sheets-datacharts-addon";
import "@grapecity-software/spread-sheets-slicers";
import "@grapecity-software/spread-sheets-print";
import "@grapecity-software/spread-sheets-barcode";
import "@grapecity-software/spread-sheets-pdf";
import "@grapecity-software/spread-sheets-pivot-addon";
import "@grapecity-software/spread-sheets-tablesheet";

import "@grapecity-software/spread-sheets-ganttsheet";
import "@grapecity-software/spread-sheets-reportsheet-addon";
import "@grapecity-software/spread-sheets-formula-panel";
import "@grapecity-software/spread-sheets-io";

// Designer + Runtime 主题 CSS 均由 useTheme 动态管理（light/dark 互斥切换），不在此静态导入

import "@grapecity-software/spread-sheets-resources-zh";
import "@grapecity-software/spread-sheets-designer-resources-cn";

import * as GCDesigner from "@grapecity-software/spread-sheets-designer";
import { Designer } from "@grapecity-software/spread-sheets-designer-react";
import { useSpreadJS } from "@/lib/spreadjs/context";

// 设置中文
GC.Spread.Common.CultureManager.culture("zh-cn");

// License（构建时由 NEXT_PUBLIC_ 环境变量内联）
GC.Spread.Sheets.LicenseKey =
	process.env.NEXT_PUBLIC_SPREADJS_LICENSE ?? "";
GCDesigner.Spread.Sheets.Designer.LicenseKey =
	process.env.NEXT_PUBLIC_SPREADJS_DESIGNER_LICENSE ?? "";

// 禁用 FILE 菜单——文件操作由 AI 工具（import_file / export_file）接管
// 浅拷贝即可，JSON 深拷贝会丢失函数属性导致运行时 TypeError
const designerConfig = {
	...GCDesigner.Spread.Sheets.Designer.DefaultConfig,
	fileMenu: undefined,
};

export default function SpreadJSDesigner() {
	const { setWorkbook } = useSpreadJS();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleDesignerInitialized = (designer: any) => {
		const workbook = designer.getWorkbook() as GC.Spread.Sheets.Workbook;
		setWorkbook(workbook);
	};

	return (
		<Designer
			config={designerConfig}
			styleInfo={{ width: "100%", height: "100%" }}
			designerInitialized={handleDesignerInitialized}
		/>
	);
}
