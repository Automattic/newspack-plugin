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
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class OnboardingWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			wizardStep: 2,
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
			}
		};
	}

	componentDidMount() {
		this.refreshLocationInfo();
		this.refreshStripeInfo();
	}

	nextWizardStep() {
		const { wizardStep } = this.state;

		this.setState( {
			wizardStep: wizardStep + 1
		} );
	}

	refreshLocationInfo() {
		apiFetch( { path: '/newspack/v1/wizard/location' } ).then( location => {
			this.setState( {
				location,
			} );
		} );
	}

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

	refreshStripeInfo() {

	}

	saveStripeSettings() {

	}

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
			<h3>Wizard complete. TODO: This should redirect to the checklist instead of displaying this message.</h3>
		);
	}
}
render( <OnboardingWizard />, document.getElementById( 'newspack-onboarding-wizard' ) );
