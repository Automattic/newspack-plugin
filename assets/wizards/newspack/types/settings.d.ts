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
