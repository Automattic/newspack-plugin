declare module '@wordpress/block-editor';

type AccessRule = {
	name: string;
	description?: string;
	conflicts?: string[];
	value?: string | string[];
	is_boolean: boolean;
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

type ContentRule = {
	label: string;
	options?: {
		value: string;
		label: string;
	}[];
};

type ContentRules = {
	[key: string]: ContentRule;
};

type Gate = {
	id: number;
	title: string;
	description: string;
	metering: Metering;
	access_rules: AccessRule[];
	content_rules: [];
};

declare global {
	interface Window {
		newspackAudienceContentGates: {
			api: string;
			available_rules: AccessRule[];
			content_rules: ContentRule[];
		};
	}
}