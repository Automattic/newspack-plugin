import { __ } from '@wordpress/i18n';

export { default as WizardApiError } from './class-wizard-api-error';

export const WIZARD_ERROR_MESSAGES = {
	MAILCHIMP_API_KEY_INVALID: __( 'Invalid Mailchimp API Key.', 'newspack-plugin' ),
};
