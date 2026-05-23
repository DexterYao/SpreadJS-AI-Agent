"use client";

import { Trash2Icon, PlayIcon, BookOpenIcon } from "lucide-react";
import type { Skill } from "@/lib/agent/skill-store";

interface SkillLibraryProps {
skills: Skill[];
loading?: boolean;
activeSkill: Skill | null;
onUseSkill: (skill: Skill) => void;
onDeleteSkill: (id: string) => void;
onClearActiveSkill: () => void;
}

export function SkillLibrary({
skills,
loading,
activeSkill,
onUseSkill,
onDeleteSkill,
onClearActiveSkill,
}: SkillLibraryProps) {
return (
<div className="flex h-full flex-col bg-background">
<div className="border-b border-border/60 px-3 py-2.5">
<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">技能库</span>
{activeSkill && (
<div className="mt-2 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2">
<BookOpenIcon className="size-3.5 shrink-0 text-primary" />
<div className="min-w-0 flex-1">
<p className="truncate text-xs font-medium text-primary">当前技能：{activeSkill.name}</p>
<p className="text-[10px] text-muted-foreground">共 {activeSkill.steps.length} 步</p>
</div>
<button
type="button"
onClick={onClearActiveSkill}
className="text-[10px] text-muted-foreground hover:text-foreground"
>
清除
</button>
</div>
)}
</div>

<div className="flex-1 overflow-y-auto chat-scrollbar">
{loading ? (
<div className="flex h-24 items-center justify-center text-xs text-muted-foreground/60">加载中...</div>
) : skills.length === 0 ? (
<div className="flex h-24 items-center justify-center text-xs text-muted-foreground/60">暂无技能</div>
) : (
<ul className="py-1">
{skills.map((skill) => {
const date = new Date(skill.updatedAt);
const dateText = date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
const isActive = activeSkill?.id === skill.id;
return (
<li key={skill.id} className={`group px-3 py-2.5 transition-colors hover:bg-accent/50 ${isActive ? "bg-primary/8" : ""}`}>
<div className="flex items-start gap-2.5">
<div className="min-w-0 flex-1">
<p className={`truncate text-xs font-medium ${isActive ? "text-primary" : "text-foreground"}`}>{skill.name}</p>
<p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground/80">{skill.description}</p>
<p className="mt-1 text-[10px] text-muted-foreground/60">{skill.steps.length} 步 · {dateText}</p>
</div>
<div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
<button
type="button"
onClick={() => onUseSkill(skill)}
className="rounded p-1 text-muted-foreground/70 hover:bg-accent hover:text-foreground"
title="使用技能"
>
<PlayIcon className="size-3" />
</button>
<button
type="button"
onClick={() => onDeleteSkill(skill.id)}
className="rounded p-1 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive"
title="删除技能"
>
<Trash2Icon className="size-3" />
</button>
</div>
</div>
</li>
);
})}
</ul>
)}
</div>
</div>
);
}
