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
	error?:
		| null
		| string
		| {
				errorCode: string;
		  };
	toggleChecked: boolean;
	toggleOnChange: ( a: boolean ) => void;
	actionContent: boolean | React.ReactNode | null;
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

type PluginCardActionText = {
	complete?: string;
	configure?: string;
	activate?: string;
	install?: string;
};

/**
 * Plugin data type
 */
type PluginCard = {
	slug: string;
	actionText?: PluginCardActionText;
	editLink?: string;
	description?: string | React.ReactNode;
	title: string;
	subTitle?: string;
	statusDescription?: Partial< {
		uninstalled: string;
		inactive: string;
		notConfigured: string;
		connected: string;
	} >;
	isEnabled?: boolean;
	isManageable?: boolean;
	// Toggle card props
	toggleChecked?: boolean;
	toggleOnChange?: ( value?: boolean ) => void;
	isStatusPrepended?: boolean;
	error?: string | null;
	onStatusChange?: ( statuses: Record< string, boolean > ) => void;
	isConfigurable?: boolean;
	isTogglable?: boolean;
	isMedium?: boolean;
	disabled?: boolean;
};
