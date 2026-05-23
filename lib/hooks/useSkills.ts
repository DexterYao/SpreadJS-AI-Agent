"use client";

import { useCallback, useEffect, useState } from "react";
import {
type Skill,
deleteSkill as deleteSkillInStore,
generateSkillId,
getSkill,
listSkills,
saveSkill as saveSkillInStore,
} from "@/lib/agent/skill-store";

const ACTIVE_SKILL_KEY = "spreadjs-agent-active-skill";

export interface SkillDraft {
name: string;
description: string;
steps: Skill["steps"];
}

function getActiveSkillId(): string | null {
if (typeof window === "undefined") return null;
return localStorage.getItem(ACTIVE_SKILL_KEY);
}

function setActiveSkillId(id: string) {
localStorage.setItem(ACTIVE_SKILL_KEY, id);
}

function clearActiveSkillId() {
localStorage.removeItem(ACTIVE_SKILL_KEY);
}

export function useSkills() {
const [skills, setSkills] = useState<Skill[]>([]);
const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
const [loading, setLoading] = useState(true);

const refreshSkills = useCallback(async () => {
const list = await listSkills();
setSkills(list);
return list;
}, []);

useEffect(() => {
let cancelled = false;
(async () => {
setLoading(true);
try {
const list = await listSkills();
if (cancelled) return;
setSkills(list);

const activeId = getActiveSkillId();
if (!activeId) return;
const active = await getSkill(activeId);
if (cancelled) return;
if (active) {
setActiveSkill(active);
} else {
clearActiveSkillId();
}
} finally {
if (!cancelled) setLoading(false);
}
})();
return () => {
cancelled = true;
};
}, []);

const saveSkill = useCallback(async (draft: SkillDraft): Promise<Skill> => {
const now = Date.now();
const skill: Skill = {
id: generateSkillId(),
name: draft.name,
description: draft.description,
steps: draft.steps,
createdAt: now,
updatedAt: now,
};
await saveSkillInStore(skill);
await refreshSkills();
return skill;
}, [refreshSkills]);

const deleteSkill = useCallback(async (id: string) => {
await deleteSkillInStore(id);
setSkills((prev) => prev.filter((s) => s.id !== id));
setActiveSkill((prev) => {
if (prev?.id === id) {
clearActiveSkillId();
return null;
}
return prev;
});
}, []);

const activateSkill = useCallback((skill: Skill) => {
setActiveSkill(skill);
setActiveSkillId(skill.id);
}, []);

const clearActiveSkill = useCallback(() => {
setActiveSkill(null);
clearActiveSkillId();
}, []);

return {
skills,
activeSkill,
loading,
refreshSkills,
saveSkill,
deleteSkill,
activateSkill,
clearActiveSkill,
};
}
