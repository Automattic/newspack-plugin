declare module '@wordpress/block-editor';

type AccessRule = {
	name: string;
	description?: string;
	conflicts?: string[];
	value?: string | string[];
};

type AccessRules = {
	[key: string]: AccessRule;
}

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
	isActive: boolean;
	isMetered: boolean;
	limitAnonymous: number;
	limitRegistered: number;
	period: string;
	accessRules: {
		[key: string]: {
			value: string[],
		};
	};
	contentRules: {
		[key: string]: {
			value: string[],
		};
	};
};

declare global {
	interface Window {
		newspackAudienceContentGates: {
			api: string;
			content_rules: ContentRules;
		};
	}
}