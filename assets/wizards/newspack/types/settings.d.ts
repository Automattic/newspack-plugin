/**
 * Error state types
 */
type ErrorParams = string | Error;

/**
 * OAuth payload
 */
type OAuthData = {
	user_basic_info?: { email: string; has_refresh_token: boolean };
	username?: string;
	error?: Error;
};

/**
 * @wordpress/components/CheckboxControl component props override. Required to apply
 * correct types to legacy version.
 */
type WpCheckboxControlPropsOverride< T > = React.ComponentProps< T > & {
	indeterminate?: boolean;
	key?: React.Key | null;
};

/**
 * Connections
 */
type SetErrorCallback<T = void> = ( a: ErrorParams ) => T;

/**
 * Catch-all type for Webhook function params and function return types
 */
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

/**
 * reCAPTCHA state params
 */
type RecaptchaData = {
	site_key?: string;
	threshold?: string;
	use_captcha?: boolean;
	site_secret?: string;
};

/**
 *
 */
type WebhookEditingState = {
	disabled?: boolean;
	disabled_error?: boolean;
	url?: string;
	bearer_token?: string;
	label?: string;
	global: boolean;
	actions?: string[];
};
