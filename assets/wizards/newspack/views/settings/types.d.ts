/**
 * OAuth payload
 */
type OAuthData = {
	user_basic_info?: { email: string; has_refresh_token: boolean };
	username?: string;
	error?: Error;
};

/**
 * Google Analytics 4 credentials Type.
 */
type Ga4Credentials = Record< string, string >;
