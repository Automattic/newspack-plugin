/**
 * Onboarding Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LocationSetup from './views/locationSetup';
import PaymentSetup from './views/PaymentSetup';
import './style.scss';

/**
 * Wizard for setting up ability to take payments. 
 * May have other settings added to it in the future.
 */
class OnboardingWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			wizardStep: 1,
			location: {
				countrystate: '',
				address1: '',
				address2: '',
				city: '',
				postcode: '',
				currency: '',
			},
			stripeSettings: {
				enabled: false,
				testMode: false,
				publishableKey: '',
				secretKey: '',
				testPublishableKey: '',
				testSecretKey: '',
			},
		};
	}

	/**
	 * Get the saved data for populating the forms when wizard is first loaded.
	 */
	componentDidMount() {
		this.refreshLocationInfo();
		this.refreshStripeInfo();
	}

	/**
	 * Go to the next wizard step.
	 */
	nextWizardStep() {
		const { wizardStep } = this.state;

		this.setState( {
			wizardStep: wizardStep + 1,
		} );
	}

	/**
	 * Get the latest saved info about business location.
	 */
	refreshLocationInfo() {
		apiFetch( { path: '/newspack/v1/wizard/location' } ).then( location => {
			this.setState( {
				location,
			} );
		} );
	}

	/**
	 * Save the current location info.
	 */
	saveLocation() {
		apiFetch( {
			path: '/newspack/v1/wizard/location',
			method: 'post',
			data: {
				...this.state.location,
			},
		} ).then( response => {
			this.nextWizardStep();
		} );
	}

	/**
	 * Get the latest saved Stripe settings.
	 */
	refreshStripeInfo() {
		apiFetch( { path: '/newspack/v1/wizard/stripe-settings' } ).then( stripeSettings => {
			this.setState( {
				stripeSettings,
			} );
		} );
	}

	/**
	 * Save the current Stripe settings.
	 */
	saveStripeSettings() {
		apiFetch( {
			path: '/newspack/v1/wizard/stripe-settings',
			method: 'post',
			data: {
				...this.state.stripeSettings,
			},
		} ).then( response => {
			this.nextWizardStep();
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const { wizardStep, location, stripeSettings } = this.state;

		if ( 1 === wizardStep ) {
			return (
				<LocationSetup
					location={ location }
					onChange={ location => this.setState( { location } ) }
					onClickContinue={ () => this.saveLocation() }
					onClickSkip={ () => this.nextWizardStep() }
				/>
			);
		}

		if ( 2 === wizardStep ) {
			return (
				<PaymentSetup
					stripeSettings={ stripeSettings }
					onChange={ stripeSettings => this.setState( { stripeSettings } ) }
					onClickFinish={ () => this.saveStripeSettings() }
					onClickCancel={ () => this.nextWizardStep() }
				/>
			);
		}

		return (
			<h3>
				Wizard complete. TODO: This should redirect to the checklist instead of displaying this
				message.
			</h3>
		);
	}
}
render( <OnboardingWizard />, document.getElementById( 'newspack-onboarding-wizard' ) );
