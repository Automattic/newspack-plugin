/**
 * Internal dependencies
 */
import WizardError from './class-wizard-error';

/**
 * Custom error class for Newspack Wizards API requests.
 */
class WizardApiError extends WizardError {
	constructor( message: string, statusCode: number, errorCode: string, details = '' ) {
		super( message, statusCode, errorCode, details );
		this.name = 'WizardApiError';

		// Set the prototype explicitly.
		Object.setPrototypeOf( this, WizardApiError.prototype );
	}
}

export default WizardApiError;
