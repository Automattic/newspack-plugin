/**
 * Wizard Action Card Props
 */
type ActionCardProps = Partial< {
	title: string | JSX.Element;
	description: string | JSX.Element | ( () => JSX.Element | string );
	actionText: JSX.Element | string | null;
	badge: string;
	className: string;
	indent: string;
	notification: string;
	notificationLevel: 'error' | 'warning';
	isMedium: boolean;
	disabled: boolean | string;
	hasGreyHeader: boolean;
	toggleChecked: boolean;
	toggleOnChange: () => void;
	actionContent: boolean | JSX.Element | null;
	error: Error | string | null;
	handoff: string | null;
	isErrorStatus: boolean;
	isChecked: boolean;
	children: boolean | JSX.Element | ( () => JSX.Element );
} >;

/**
 * Plugin data type
 */
type PluginCard = {
	actionText?: JSX.Element | string | null;
	path: string;
	slug: string;
	editLink?: string;
	description?:
		| string
		| ( ( errorMessage: string | null, isFetching: boolean, status: string | null ) => string );
	name: string;
	url?: string;
	status?: string;
	badge?: string;
	indent?: string;
	error?: string | null | Error;
};
