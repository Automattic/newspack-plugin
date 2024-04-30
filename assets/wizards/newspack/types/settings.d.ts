/**
 * Error state handling callback params
 */
type ErrorStateParams = string | undefined | any[];

/**
 * OAuth payload
 */
type OAuthData = {
	user_basic_info?: { email: string; has_refresh_token: boolean };
	username?: string;
};

type WpCheckboxControlPropsOverride< T > = React.ComponentProps< T > & {
	indeterminate?: boolean;
	key?: React.Key | null;
};

/**
 * Connections
 */
type SetErrorCallback = ( a?: ErrorStateParams ) => void;

type Endpoint = {
	url: string;
	label: string;
	requests: {
		errors: any[];
		id: string;
		status: 'pending' | 'finished' | 'killed';
		scheduled: string;
		action_name: string;
	}[];
} & {
	disabled: boolean;
	disabled_error: boolean;
	id: string;
	system: string;
	global: boolean;
	actions: string[];
};

type RecaptchaData = {
	site_key?: string;
	threshold?: string;
	use_captcha?: boolean;
	site_secret?: string;
};

type WebhookEditingState = {
	disabled?: boolean;
	disabled_error?: boolean;
	url?: string;
	bearer_token?: string;
	label?: string;
	global: boolean;
	actions?: string[];
};
