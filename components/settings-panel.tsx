"use client";

import { useState } from "react";
import { RotateCcwIcon, SunIcon, MoonIcon, MonitorIcon, Trash2Icon } from "lucide-react";
import type { McpServerStatus } from "@/lib/mcp/types";
import { type AppSettings, type ThemeMode, DEFAULT_SETTINGS } from "@/lib/hooks/useSettings";
import { CHAT_PANEL_WIDTH } from "@/lib/config";
import { McpSettings } from "@/components/mcp-settings";

interface SettingsPanelProps {
	settings: AppSettings;
	onUpdateSettings: (patch: Partial<AppSettings>) => void;
	chatPanelWidth?: number;
	onChatPanelWidthChange?: (width: number) => void;
	onClearAutoSave?: () => Promise<void>;
	autoSaveExists?: boolean;
	mcpServers: McpServerStatus[];
	mcpLoading: boolean;
	mcpError: string | null;
	mcpConfigJson: string;
	onMcpSaveAndConnect: (json: string) => Promise<void>;
	onMcpToggleServer: (name: string, enabled: boolean) => Promise<void>;
	onMcpDisconnectAll: () => Promise<void>;
	onMcpAuthorize?: (name: string) => Promise<void>;
}

type Tab = "general" | "mcp";

export function SettingsPanel({
	settings,
	onUpdateSettings,
	chatPanelWidth,
	onChatPanelWidthChange,
	onClearAutoSave,
	autoSaveExists,
	mcpServers,
	mcpLoading,
	mcpError,
	mcpConfigJson,
	onMcpSaveAndConnect,
	onMcpToggleServer,
	onMcpDisconnectAll,
	onMcpAuthorize,
}: SettingsPanelProps) {
	const [activeTab, setActiveTab] = useState<Tab>("general");

	return (
		<div className="flex h-full flex-col">
			{/* Tab bar */}
			<div className="flex items-center gap-1 border-b border-border/60 px-4 pt-3 pb-0">
				<TabButton active={activeTab === "general"} onClick={() => setActiveTab("general")}>
					通用
				</TabButton>
				<TabButton active={activeTab === "mcp"} onClick={() => setActiveTab("mcp")}>
					MCP 服务
				</TabButton>
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-y-auto chat-scrollbar">
				{activeTab === "general" && (
					<GeneralSettings
						settings={settings}
						onUpdate={onUpdateSettings}
						chatPanelWidth={chatPanelWidth}
						onChatPanelWidthChange={onChatPanelWidthChange}
						onClearAutoSave={onClearAutoSave}
						autoSaveExists={autoSaveExists}
					/>
				)}
				{activeTab === "mcp" && (
					<McpSettings
						key={mcpConfigJson || "default-mcp-config"}
						servers={mcpServers}
						loading={mcpLoading}
						error={mcpError}
						configJson={mcpConfigJson}
						onSaveAndConnect={onMcpSaveAndConnect}
						onToggleServer={onMcpToggleServer}
						onDisconnectAll={onMcpDisconnectAll}
						onAuthorize={onMcpAuthorize}
					/>
				)}
			</div>
		</div>
	);
}

// ── General Settings ─────────────────────────────────────────────────────

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 800;

function GeneralSettings({
	settings,
	onUpdate,
	chatPanelWidth,
	onChatPanelWidthChange,
	onClearAutoSave,
	autoSaveExists,
}: {
	settings: AppSettings;
	onUpdate: (patch: Partial<AppSettings>) => void;
	chatPanelWidth?: number;
	onChatPanelWidthChange?: (width: number) => void;
	onClearAutoSave?: () => Promise<void>;
	autoSaveExists?: boolean;
}) {
	const isDefaultSteps = settings.maxAutoSteps === DEFAULT_SETTINGS.maxAutoSteps;
	const isDefaultWidth = chatPanelWidth === CHAT_PANEL_WIDTH;
	const isDefaultTheme = settings.theme === DEFAULT_SETTINGS.theme;

	return (
		<div className="flex flex-col gap-5 p-4">
			<h3 className="text-sm font-semibold text-foreground">通用设置</h3>

			{/* 主题 */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<label className="text-xs font-medium text-foreground" htmlFor="theme-mode">
						主题
					</label>
					{!isDefaultTheme && (
						<ResetButton onClick={() => onUpdate({ theme: DEFAULT_SETTINGS.theme })} />
					)}
				</div>
				<p className="text-xs text-muted-foreground">选择界面的颜色主题。</p>
				<ThemeSelector value={settings.theme} onChange={(t) => onUpdate({ theme: t })} />
			</div>

			{/* 最大自动步数 */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<label className="text-xs font-medium text-foreground" htmlFor="max-auto-steps">
						最大自动步数
					</label>
					<div className="flex items-center gap-2">
						{!isDefaultSteps && (
							<ResetButton onClick={() => onUpdate({ maxAutoSteps: DEFAULT_SETTINGS.maxAutoSteps })} />
						)}
						<input
							id="max-auto-steps"
							type="number"
							min={1}
							max={100}
							value={settings.maxAutoSteps}
							onChange={(e) => {
								const v = parseInt(e.target.value, 10);
								if (!Number.isNaN(v) && v >= 1 && v <= 100) {
									onUpdate({ maxAutoSteps: v });
								}
							}}
							className="h-7 w-16 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>
				<p className="text-xs text-muted-foreground">
					AI 连续自动执行工具调用的最大步数，超过后暂停等待确认。
				</p>
			</div>

			{/* 自动恢复会话 */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<label className="text-xs font-medium text-foreground" htmlFor="auto-restore-session">
						自动恢复会话
					</label>
					<button
						id="auto-restore-session"
						type="button"
						role="switch"
						aria-checked={settings.autoRestoreSession}
						onClick={() => onUpdate({ autoRestoreSession: !settings.autoRestoreSession })}
						className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
							settings.autoRestoreSession ? "bg-primary" : "bg-input"
						}`}
					>
						<span
							className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
								settings.autoRestoreSession ? "translate-x-4" : "translate-x-0"
							}`}
						/>
					</button>
				</div>
				<p className="text-xs text-muted-foreground">
					刷新页面后自动还原到上次的对话会话。
				</p>
			</div>

			{/* 自动保存 */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<label className="text-xs font-medium text-foreground" htmlFor="auto-save">
						自动保存
					</label>
					<button
						id="auto-save"
						type="button"
						role="switch"
						aria-checked={settings.autoSave}
						onClick={() => onUpdate({ autoSave: !settings.autoSave })}
						className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
							settings.autoSave ? "bg-primary" : "bg-input"
						}`}
					>
						<span
							className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
								settings.autoSave ? "translate-x-4" : "translate-x-0"
							}`}
						/>
					</button>
				</div>
				<p className="text-xs text-muted-foreground">
					AI 回复完成后自动保存工作簿状态，刷新页面后自动恢复。
				</p>
				{settings.autoSave && onClearAutoSave && (
					<button
						type="button"
						onClick={onClearAutoSave}
						disabled={!autoSaveExists}
						className="inline-flex items-center gap-1.5 self-start rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
					>
						<Trash2Icon className="size-3.5" />
						清除已保存的数据
					</button>
				)}
			</div>

			{/* 覆盖保护 */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<label className="text-xs font-medium text-foreground" htmlFor="allow-all-destructive">
						跳过操作确认
					</label>
					<button
						id="allow-all-destructive"
						type="button"
						role="switch"
						aria-checked={settings.allowAllDestructive}
						onClick={() => onUpdate({ allowAllDestructive: !settings.allowAllDestructive })}
						className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
							settings.allowAllDestructive ? "bg-primary" : "bg-input"
						}`}
					>
						<span
							className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
								settings.allowAllDestructive ? "translate-x-4" : "translate-x-0"
							}`}
						/>
					</button>
				</div>
				<p className="text-xs text-muted-foreground">
					开启后，AI 写入或删除已有数据时不再弹出确认提示，直接执行操作。
				</p>
			</div>

			{/* 显示上下文用量 */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<label className="text-xs font-medium text-foreground" htmlFor="show-context-usage">
						显示上下文用量
					</label>
					<button
						id="show-context-usage"
						type="button"
						role="switch"
						aria-checked={settings.showContextUsage}
						onClick={() => onUpdate({ showContextUsage: !settings.showContextUsage })}
						className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
							settings.showContextUsage ? "bg-primary" : "bg-input"
						}`}
					>
						<span
							className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
								settings.showContextUsage ? "translate-x-4" : "translate-x-0"
							}`}
						/>
					</button>
				</div>
				<p className="text-xs text-muted-foreground">
					在输入框右下角显示上下文窗口的使用情况。
				</p>
			</div>

			{/* 聊天面板宽度 */}
			{chatPanelWidth != null && onChatPanelWidthChange && (
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<label className="text-xs font-medium text-foreground" htmlFor="chat-panel-width">
							聊天面板宽度
						</label>
						<div className="flex items-center gap-2">
							{!isDefaultWidth && (
								<ResetButton onClick={() => onChatPanelWidthChange(CHAT_PANEL_WIDTH)} />
							)}
							<input
								id="chat-panel-width"
								type="number"
								min={MIN_PANEL_WIDTH}
								max={MAX_PANEL_WIDTH}
								step={10}
								value={chatPanelWidth}
								onChange={(e) => {
									const v = parseInt(e.target.value, 10);
									if (!Number.isNaN(v) && v >= MIN_PANEL_WIDTH && v <= MAX_PANEL_WIDTH) {
										onChatPanelWidthChange(v);
									}
								}}
								className="h-7 w-16 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
							/>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						右侧聊天面板的宽度（像素），也可拖拽面板左侧边缘调整。
					</p>
				</div>
			)}
		</div>
	);
}

// ── Theme Selector ──────────────────────────────────────────────────────

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
	{ value: "light", label: "浅色", icon: <SunIcon className="size-3.5" /> },
	{ value: "dark", label: "深色", icon: <MoonIcon className="size-3.5" /> },
	{ value: "system", label: "跟随系统", icon: <MonitorIcon className="size-3.5" /> },
];

function ThemeSelector({ value, onChange }: { value: ThemeMode; onChange: (t: ThemeMode) => void }) {
	return (
		<div className="flex rounded-md border border-input bg-background p-0.5 shadow-sm">
			{THEME_OPTIONS.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => onChange(opt.value)}
					className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1.5 text-xs font-medium transition-colors ${
						value === opt.value
							? "bg-primary text-primary-foreground shadow-sm"
							: "text-muted-foreground hover:bg-accent hover:text-foreground"
					}`}
				>
					{opt.icon}
					{opt.label}
				</button>
			))}
		</div>
	);
}

// ── Reset Button ─────────────────────────────────────────────────────────

function ResetButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
		>
			<RotateCcwIcon className="size-3" />
			还原默认
		</button>
	);
}

// ── Tab Button ───────────────────────────────────────────────────────────

function TabButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`relative px-3 py-2 text-xs font-medium transition-colors ${
				active
					? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
					: "text-muted-foreground hover:text-foreground"
			}`}
		>
			{children}
		</button>
	);
}
