/**
 * OAuth payload
 */
type OAuthData = {
	user_basic_info?: { email: string; has_refresh_token: boolean };
	username?: string;
	error?: Error;
};
