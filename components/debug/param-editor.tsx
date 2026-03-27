"use client";

import { JsonEditor } from "@/components/ui/json-editor";

interface ParamEditorProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function ParamEditor({ value, onChange, error }: ParamEditorProps) {
	return (
		<JsonEditor
			value={value}
			onChange={onChange}
			minHeight="200px"
			maxHeight="400px"
			error={error}
		/>
	);
}
