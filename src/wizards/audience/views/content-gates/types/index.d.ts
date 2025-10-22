declare module '@wordpress/block-editor';

type AccessRule = {
	name: string;
	description: string;
	options?: { value: string; label: string }[];
	conflicts?: string[];
	is_boolean: boolean;
	default: string | string[] | boolean;
};

type ContentRule = {
	name: string;
	description?: string;
	options?: { value: string; label: string }[];
	value: string[];
	default: string[];
};

type Metering = {
	enabled: boolean;
	anonymous_count: number;
	registered_count: number;
	period: string;
};

type AccessRules = {
	[key: string]: AccessRule;
};

type ContentRules = {
	[key: string]: ContentRule;
};

type GateAccessRule = {
	slug: string;
	value: string | string[] | boolean;
};

type GateContentRule = {
	slug: string;
	value: string[];
};

type GateRuleControlProps = {
	slug: string;
	value: string | string[] | boolean;
	onChange: (value: string | string[] | boolean) => void;
};

type Gate = {
	id: number;
	title: string;
	description: string;
	metering: Metering;
	access_rules: GateAccessRule[];
	content_rules: GateContentRule[];
};
