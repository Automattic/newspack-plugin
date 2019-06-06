/**
 * Subscriptions onboarding Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LocationSetup from './views/locationSetup';
import PaymentSetup from './views/PaymentSetup';
import { PluginInstaller, Card, FormattedHeader } from '../../components/src';
import './style.scss';

const REQUIRED_PLUGINS = [ 'woocommerce' ];

/**
 * Wizard for setting up ability to take payments.
 * May have other settings added to it in the future.
 */
class SubscriptionsOnboardingWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			pluginRequirementsMet: false,
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
			options: {
				countrystate: [],
				currency: [],
			}
		};
	}

	/**
	 * Get the saved data for populating the forms when wizard is first loaded.
	 */
	componentDidUpdate( prevProps, prevState ) {
		if ( ! prevState.pluginRequirementsMet && this.state.pluginRequirementsMet ) {
			this.refreshOptions();
			this.refreshLocationInfo();
			this.refreshStripeInfo();
		}		
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

	refreshOptions() {
		apiFetch( { path: '/newspack/v1/wizard/location/options' } ).then( options => {
			this.setState( {
				options,
			} );
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
		const { pluginRequirementsMet, wizardStep, location, stripeSettings, options } = this.state;

		if ( ! pluginRequirementsMet ) {
			return (
				<Card noBackground>
					<FormattedHeader
						headerText={ __( 'Required plugin' ) }
						subHeaderText={ __( 'This feature requires the following plugin.') }
					/>
					<PluginInstaller
						plugins={ REQUIRED_PLUGINS }
						onComplete={ () => this.setState( { pluginRequirementsMet: true } ) }
					/>
				</Card>
			);
		}

		if ( 1 === wizardStep ) {
			return (
				<LocationSetup
					countrystateFields={ options.countrystate }
					currencyFields={ options.currency }
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
render( <SubscriptionsOnboardingWizard />, document.getElementById( 'newspack-subscriptions-onboarding-wizard' ) );
