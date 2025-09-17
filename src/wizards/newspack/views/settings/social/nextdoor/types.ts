/**
 * TypeScript type definitions for Nextdoor integration
 */

export interface NextdoorSettings {
	client_id?: string;
	client_secret?: string;
	access_token?: string;
	refresh_token?: string;
	token_expires_at?: string;
	page_id?: string;
	publication_url?: string;
	allowed_roles?: string[];
	test_mode?: boolean;
}

export interface NextdoorStatus {
	is_connected: boolean;
	has_credentials: boolean;
	has_tokens: boolean;
	has_page: boolean;
	token_valid: boolean;
	error?: string;
}

export interface NextdoorData {
	module_enabled_nextdoor: boolean;
	is_connected: boolean;
	connection_status: NextdoorStatus & {
		publication_url: string;
		allowed_roles: string[];
	};
}

export interface OAuthResponse {
	login_url?: string;
}

export interface ClaimPageResponse {
	page_id?: number;
	success?: boolean;
}

export interface OnboardingViewProps {
	settings: NextdoorSettings;
	status: NextdoorStatus;
	error: string | null;
	updateSettings: ( settings: Partial< NextdoorSettings > ) => Promise< NextdoorSettings >;
	startOAuthFlow: ( email: string, country: string ) => Promise< OAuthResponse >;
	claimPage: ( publicationUrl: string, test?: boolean ) => Promise< ClaimPageResponse >;
	disconnect: () => Promise< void >;
	setError: ( error: string | null ) => void;
	onBack?: () => void;
}

export interface SettingsViewProps {
	settings: NextdoorSettings;
	status: NextdoorStatus;
	error: string | null;
	updateSettings: ( settings: Partial< NextdoorSettings > ) => Promise< NextdoorSettings >;
	setError: ( error: string | null ) => void;
	onBack?: () => void;
}
