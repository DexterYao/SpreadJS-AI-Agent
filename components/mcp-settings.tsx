"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonEditor } from "@/components/ui/json-editor";
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { McpServerStatus } from "@/lib/mcp/types";
import { DEFAULT_MCP_CONFIG } from "@/lib/hooks/useMcpServers";
import { ChevronRightIcon, KeyRoundIcon } from "lucide-react";

interface McpSettingsProps {
	servers: McpServerStatus[];
	loading: boolean;
	error: string | null;
	configJson: string;
	onSaveAndConnect: (json: string) => Promise<void>;
	onToggleServer: (name: string, enabled: boolean) => Promise<void>;
	onDisconnectAll: () => Promise<void>;
	onAuthorize?: (name: string) => Promise<void>;
}

export function McpSettings({
	servers,
	loading,
	error,
	configJson,
	onSaveAndConnect,
	onToggleServer,
	onDisconnectAll,
	onAuthorize,
}: McpSettingsProps) {
	const [code, setCode] = useState(() => configJson || DEFAULT_MCP_CONFIG);
	const [localError, setLocalError] = useState<string | null>(null);

	const handleSave = async () => {
		setLocalError(null);
		try {
			await onSaveAndConnect(code);
		} catch (e) {
			setLocalError(e instanceof Error ? e.message : String(e));
		}
	};

	const handleDisconnect = async () => {
		setLocalError(null);
		try {
			await onDisconnectAll();
			setCode(DEFAULT_MCP_CONFIG);
		} catch (e) {
			setLocalError(e instanceof Error ? e.message : String(e));
		}
	};

	const displayError = localError ?? error;

	return (
		<div className="flex flex-col gap-4 p-4">
			<h3 className="text-sm font-semibold text-foreground">
				MCP 服务器管理
			</h3>
			<p className="text-xs leading-5 text-muted-foreground">
				内置 `spreadjs-mcp` 默认使用占位 token，不会自动连接。请先到
				{" "}
				<a
					href="https://mcp.grapecity.com.cn/"
					target="_blank"
					rel="noreferrer"
					className="text-primary underline underline-offset-2"
				>
					https://mcp.grapecity.com.cn/
				</a>
				{" "}
				注册账号获取 token，再替换 JSON 里的 `headers.token`。
			</p>

			{/* JSON Editor */}
			<JsonEditor
				value={code}
				onChange={setCode}
				minHeight="240px"
				maxHeight="384px"
				error={displayError ?? undefined}
			/>

			{/* Actions */}
			<div className="flex gap-2">
				<Button
					size="sm"
					onClick={handleSave}
					disabled={loading}
				>
					{loading ? <Spinner className="mr-1" /> : null}
					保存并连接
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={handleDisconnect}
					disabled={loading || servers.length === 0}
				>
					全部断开
				</Button>
			</div>

			{/* Server status list */}
			{servers.length > 0 && (
				<div className="flex flex-col gap-2">
					<h4 className="text-xs font-medium text-muted-foreground">
						连接状态
					</h4>
					{servers.map(s => (
						<ServerCard
							key={s.name}
							server={s}
							onToggle={onToggleServer}
							onAuthorize={onAuthorize}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ── Server Card ──────────────────────────────────────────────────────────

function ServerCard({
	server,
	onToggle,
	onAuthorize,
}: {
	server: McpServerStatus;
	onToggle: (name: string, enabled: boolean) => Promise<void>;
	onAuthorize?: (name: string) => Promise<void>;
}) {
	const dotColor = !server.enabled
		? "bg-muted-foreground/40"
		: server.connected
			? "bg-emerald-500"
			: "bg-destructive";

	const needsAuth = server.oauthStatus === "unauthorized" || server.oauthStatus === "expired";

	return (
		<Collapsible>
			<div className="rounded-md border border-border bg-card p-3">
				{/* Header */}
				<div className="flex items-center justify-between">
					<CollapsibleTrigger className="flex items-center gap-2 group cursor-pointer">
						<ChevronRightIcon className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
						<span className={`size-2 rounded-full ${dotColor}`} />
						<span className="text-sm font-medium">{server.name}</span>
							{server.oauthStatus && <OAuthBadge status={server.oauthStatus} />}
					</CollapsibleTrigger>
					<div className="flex items-center gap-2">
						{needsAuth && onAuthorize && (
							<Button
								size="sm"
								variant="outline"
								className="h-6 px-2 text-xs gap-1"
								onClick={() => onAuthorize(server.name)}
							>
								<KeyRoundIcon className="size-3" />
								授权
							</Button>
						)}
						<Badge variant="secondary" className="text-[10px]">
							{server.toolCount} 个工具
						</Badge>
						<button
							type="button"
							role="switch"
							aria-checked={server.enabled}
							onClick={() => onToggle(server.name, !server.enabled)}
							className={`
								relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
								border-2 border-transparent transition-colors
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
								${server.enabled ? "bg-primary" : "bg-muted"}
							`}
						>
							<span
								className={`
									pointer-events-none block size-4 rounded-full bg-background shadow-sm
									transition-transform ${server.enabled ? "translate-x-4" : "translate-x-0"}
								`}
							/>
						</button>
					</div>
				</div>

				{/* Status line */}
				{server.error && (
					<p className="mt-1 ml-7 text-xs text-destructive">{server.error}</p>
				)}

				{/* Tool list (collapsible) — table layout */}
				<CollapsibleContent>
					{server.tools.length > 0 ? (
						<div className="mt-2 overflow-x-auto">
							<table className="w-full text-xs border-collapse">
								<thead>
									<tr className="border-b border-border/50 text-muted-foreground/70">
										<th className="py-1.5 px-2 text-left font-medium">名称</th>
										<th className="py-1.5 px-2 text-left font-medium">描述</th>
										<th className="py-1.5 px-2 text-left font-medium">参数</th>
									</tr>
								</thead>
								<tbody>
									{server.tools.map(t => {
										const params = extractParamNames(t.inputSchema);
										return (
											<tr key={t.name} className="border-b border-border/30 last:border-0">
												<td className="py-1.5 px-2 font-mono text-foreground/80 whitespace-nowrap align-top">
													{t.name}
												</td>
												<td className="py-1.5 px-2 text-muted-foreground/70 max-w-[200px] align-top">
													{t.description ? (
														<TooltipProvider delayDuration={500}>
															<Tooltip>
																<TooltipTrigger asChild>
																	<span className="line-clamp-2 cursor-default">{t.description}</span>
																</TooltipTrigger>
																<TooltipContent side="top" className="max-w-xs whitespace-normal bg-popover text-popover-foreground border border-border shadow-md [--tooltip-bg:var(--color-popover)]">
																	{t.description}
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													) : (
														<span>—</span>
													)}
												</td>
												<td className="py-1.5 px-2 align-top">
													{params.length > 0 ? (
														<span className="flex flex-wrap gap-1">
															{params.map(p => (
																<span key={p} className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
																	{p}
																</span>
															))}
														</span>
													) : (
														<span className="text-muted-foreground/40">—</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<p className="mt-2 ml-7 text-xs text-muted-foreground">
							暂无可用工具
						</p>
					)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}

// ── OAuth Badge ─────────────────────────────────────────────────────────

function OAuthBadge({ status }: { status: McpServerStatus["oauthStatus"] }) {
	if (status === "authorized") {
		return <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-600">已授权</Badge>;
	}
	if (status === "expired") {
		return <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-600">已过期</Badge>;
	}
	return <Badge variant="secondary" className="text-[10px] bg-destructive/15 text-destructive">未授权</Badge>;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** 从 JSON Schema 的 inputSchema 中提取参数名列表 */
function extractParamNames(schema: Record<string, unknown>): string[] {
	const props = schema?.properties;
	if (!props || typeof props !== "object") return [];
	return Object.keys(props as Record<string, unknown>);
}
