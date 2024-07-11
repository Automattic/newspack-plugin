/**
 * Wizard Action Card Props
 */
type ActionCardProps = Partial< {
	title: string | JSX.Element;
	description: React.ReactNode;
	actionText: JSX.Element | string | null;
	badge: string;
	className: string;
	indent: string;
	notification: string;
	notificationLevel: 'error' | 'warning';
	isMedium: boolean;
	disabled: boolean | string;
	hasGreyHeader: boolean;
	toggleChecked: any;
	toggleOnChange: any;
	actionContent: boolean | JSX.Element | null;
	error?:
		| null
		| string
		| {
				errorCode: string;
		  };
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
	deactivate: PluginWizardApiFetchCallback;
	install: PluginWizardApiFetchCallback;
	configure: PluginWizardApiFetchCallback;
};

/**
 * Plugin partial response
 */
type PluginResponse = { Status: string; Configured: boolean };

/**
 * Plugin Wizard API fetch callback
 */
type PluginWizardApiFetchCallback = (
	callbacks?: ApiFetchCallbacks< PluginResponse >
) => Promise< PluginResponse >;

/**
 * Plugin data type
 */
type PluginCard = {
	slug: string;
	actionText?: string | null;
	editLink?: string;
	description?: string | React.ReactNode;
	title: string;
	subTitle?: string;
	statusDescription?: Partial< {
		uninstalled: string;
		inactive: string;
		notConfigured: string;
	} >;
	isEnabled?: boolean;
	isManageable?: boolean;
	// Toggle card props
	toggleChecked?: boolean;
	toggleOnChange?: ( value: boolean ) => void;
	isStatusPrepended?: boolean;
};
