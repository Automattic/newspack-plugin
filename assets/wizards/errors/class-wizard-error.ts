class WizardError extends Error {
	statusCode: number;
	errorCode: string;
	details: string;

	constructor( message: string, statusCode: number, errorCode: string, details = '' ) {
		super( message );
		this.name = 'WizardError';
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = details;

		if ( Object.setPrototypeOf ) {
			Object.setPrototypeOf( this, new.target.prototype );
		}
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			statusCode: this.statusCode,
			errorCode: this.errorCode,
			details: this.details,
		};
	}
}

export default WizardError;
