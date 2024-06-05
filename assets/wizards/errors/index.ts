import { __ } from '@wordpress/i18n';

export { default as WizardError } from './class-wizard-error';
export { default as WizardApiError } from './class-wizard-api-error';

export const WIZARD_ERROR_MESSAGES = {
	RECAPTCHA_KEY_SECRET_INVALID: __(
		'You must enter a valid site key and secret to use reCAPTCHA.',
		'newspack-plugin'
	),
};
