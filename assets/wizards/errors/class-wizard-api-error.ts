import WizardError from './class-wizard-error';

class WizardApiError extends WizardError {
	constructor( message: string, statusCode: number, errorCode: string, details = '' ) {
		super( message, statusCode, errorCode, details );
		this.name = 'WizardApiError';

		// Set the prototype explicitly.
		Object.setPrototypeOf( this, WizardApiError.prototype );
	}
}

export default WizardApiError;
