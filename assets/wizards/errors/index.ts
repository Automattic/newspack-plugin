import { __ } from '@wordpress/i18n';

export { default as WizardError } from './class-wizard-error';
export { default as WizardApiError } from './class-wizard-api-error';

export const WIZARD_ERROR_MESSAGES = {
	MAILCHIMP_API_KEY_INVALID: __( 'Invalid Mailchimp API Key.', 'newspack-plugin' ),
	GOOGLEOAUTH_REFRESH_TOKEN_EXPIRED: __(
		'Missing Google refresh token. Please re-authenticate site.',
		'newspack-plugin'
	),
};
