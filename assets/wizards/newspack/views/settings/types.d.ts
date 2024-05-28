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
type SetErrorCallback< T = void > = ( a: ErrorParams ) => T;

/**
 * Endpoint data type
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
	disabled: boolean;
	disabled_error: boolean;
	id: string | number;
	system: string;
	global: boolean;
	actions: string[];
	bearer_token?: string;
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
 * Plugin data type
 */
type PluginCard = {
	path: string;
	pluginSlug: string;
	editLink: string;
	name: string;
	url?: string;
	status?: string;
	badge?: string;
	indent?: string;
	error?: {
		code: string;
	};
};

type Ga4Credentials = Record< string, string >;
