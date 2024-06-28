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
	error: string | null;
	handoff: string | null;
	isErrorStatus: boolean;
	isChecked: boolean;
	children: boolean | JSX.Element | ( () => JSX.Element );
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
	path: string;
	slug: string;
	editLink?: string;
	description?: JSX.Element;
	title: string;
	subTitle?: string;
	statusDescription?: Partial< {
		uninstalled: string;
		inactive: string;
		notConfigured: string;
	} >;
	hidden?: boolean;
	callbacks?: (
		waf: WizardApiFetch< { Status: string; Configured: boolean } >
	) => Partial< PluginCallbacks >;
};
