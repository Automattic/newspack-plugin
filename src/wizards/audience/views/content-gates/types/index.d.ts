declare module '@wordpress/block-editor';

type AccessRule = {
	name: string;
	description: string;
	conflicts?: string[];
	value?: string | string[];
};

type AccessRules = {
	[key: string]: AccessRule;
}

type Gate = {
	id: number;
	title: string;
	description: string;
	isActive: boolean;
	isMetered: boolean;
	limitAnonymous: number;
	limitRegistered: number;
	period: string;
	accessRules: AccessRule[];
};
