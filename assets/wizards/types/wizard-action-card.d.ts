/**
 * Wizard Action Card Props
 */
type ActionCardProps = {
	title: string | JSX.Element;
	description: string | JSX.Element | ( () => JSX.Element | string );
	actionText?: JSX.Element | null;
	badge?: string;
	className?: string;
	indent?: string;
	notification?: string;
	notificationLevel?: 'error' | 'warning';
	isMedium?: boolean;
	disabled?: boolean | string;
	hasGreyHeader?: boolean;
	toggleChecked?: boolean;
	toggleOnChange?: () => void;
	actionContent?: boolean | JSX.Element;
	error?: string;
	isErrorStatus?: boolean;
	isChecked?: boolean;
	children?: boolean | JSX.Element | ( () => JSX.Element );
};
