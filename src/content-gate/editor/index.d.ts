/**
 * Types.
 */
type BlockSettings = {
	attributes: Record<string, any>;
	name: string;
};
type DynamicOptionItem = {
	id: string | number;
	title: {
		raw: string;
	};
};
type AccessRuleConfig = {
	name: string;
	description: string;
	default: string | Array<string | number>;
	is_boolean: boolean;
	options: Array<{ value: string | number; label: string }>;
};

declare global {
	interface Window {
		newspackBlockVisibility: {
			available_access_rules: Record<string, AccessRuleConfig>;
		};
	}
}