import type { SpreadWorksheet } from "@/lib/agent/types";

export interface SelectableNamedObject {
	isSelected?: () => boolean;
	name: () => string;
}

export interface SheetSelection {
	col: number;
	row: number;
	colCount: number;
	rowCount: number;
}

export interface ValueChangedEventArgs {
	sheetName: string;
	col: number;
	row: number;
}

export interface ChangedCell {
	col: number;
	row: number;
}

export interface RangeChangedEventArgs {
	sheetName: string;
	changedCells?: ChangedCell[];
	row: number;
	col: number;
	rowCount?: number;
	colCount?: number;
}

export interface RowChangedEventArgs {
	sheetName: string;
	row: number;
}

export interface ColumnChangedEventArgs {
	sheetName: string;
	col: number;
}

export interface SheetNameChangedEventArgs {
	oldValue: string;
	newValue: string;
}

type EventHandler<TArgs> = (event: unknown, args: TArgs) => void;

export interface BindableSpreadWorksheet extends SpreadWorksheet {
	bind: <TArgs>(eventName: string, handler: EventHandler<TArgs>) => void;
	unbind: <TArgs>(eventName: string, handler: EventHandler<TArgs>) => void;
}

export type InteractiveSpreadWorksheet = BindableSpreadWorksheet & {
	charts?: { all?: () => SelectableNamedObject[] };
	shapes?: { all?: () => SelectableNamedObject[] };
	pictures?: { all?: () => SelectableNamedObject[] };
	getSelections: () => SheetSelection[] | null | undefined;
};

export function asInteractiveWorksheet(
	sheet: SpreadWorksheet,
): InteractiveSpreadWorksheet {
	return sheet as InteractiveSpreadWorksheet;
}
