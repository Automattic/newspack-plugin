/**
 * Wizard Action Card Props
 */
type ActionCardProps = Partial< {
	title: string | JSX.Element;
	titleLink?: string;
	href?: string;
	description: string | JSX.Element | ( () => JSX.Element | string );
	actionText: JSX.Element | string | null;
	badge: string;
	className: string;
	indent: string;
	notification: string;
	notificationLevel: 'error' | 'warning' | 'info';
	isMedium: boolean;
	disabled: boolean | string;
	hasGreyHeader: boolean;
	toggleChecked: boolean;
	toggleOnChange: ( a?: boolean ) => void;
	actionContent: boolean | JSX.Element | null;
	error: string | null;
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
	description?: (
		errorMessage: string | null,
		isFetching: boolean,
		status: string | null
	) => string;
	name: string;
	url?: string;
	status?: string;
	badge?: string;
	indent?: string;
	error?: null | {
		errorCode: string;
	};
};
