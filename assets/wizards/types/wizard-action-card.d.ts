/**
 * Wizard Action Card Props
 */
type ActionCardProps = Partial< {
	title: string | React.ReactNode;
	titleLink?: string;
	href?: string;
	description: string | React.ReactNode;
	actionText: React.ReactNode | string | null;
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
	actionContent: boolean | React.ReactNode | null;
	error: string | null;
	handoff: string | null;
	isErrorStatus: boolean;
	isChecked: boolean;
	children: boolean | React.ReactNode;
} >;

/**
 * Plugin callbacks for install, activate and init states
 */
type PluginCallbacks = {
	init: PluginWizardApiFetchCallback;
	activate: PluginWizardApiFetchCallback;
	install: PluginWizardApiFetchCallback;
};

/**
 * Plugin Wizard API fetch callback
 */
type PluginWizardApiFetchCallback = (
	callbacks?: ApiFetchCallbacks< { Status: string; Configured: boolean } >
) => Promise< { Status: string; Configured: boolean } >;

/**
 * Plugin data type
 */
type PluginCard = {
	slug: string;
	editLink?: string;
	description?: JSX.Element | string;
	title: string;
	subTitle?: string;
	statusDescription?: Partial< {
		uninstalled: string;
		inactive: string;
		notConfigured: string;
	} >;
	isEnabled?: boolean;
	isManageable?: boolean;
};
