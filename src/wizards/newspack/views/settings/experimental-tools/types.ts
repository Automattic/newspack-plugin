export interface ToolField {
	type: 'textarea' | 'text' | 'select' | 'toggle' | 'display';
	key: string;
	label: string;
	help?: string;
	default?: string;
	placeholder?: string;
	value?: string | number | boolean;
	options?: Array< { label: string; value: string } >;
	validation?: 'float' | 'integer';
	min?: number;
	max?: number;
}

export interface Tool {
	slug: string;
	label: string;
	description: string;
	constant: string | null;
	constant_active: boolean;
	enabled: boolean;
	enabled_at: number | null;
	enabled_by: number | null;
	fields: ToolField[];
}
