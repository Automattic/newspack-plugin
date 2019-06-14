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
import PaymentSetup from './views/paymentSetup';
import { FormattedHeader, Wizard, WizardScreen } from '../../components/src';
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
			currentScreen: '',
			error: false,

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
			fields: {
				countrystate: [],
				currency: [],
			},
		};
	}

	/**
	 * Get the saved data for populating the forms when wizard is first loaded.
	 */
	onWizardReady() {
		this.setState( {
			currentScreen: 'location-setup',
		} );
		this.refreshFieldOptions();
		this.refreshLocationInfo();
		this.refreshStripeInfo();
	}

	/**
	 * Get information used for populating complex dropdown menus.
	 */
	refreshFieldOptions() {
		apiFetch( { path: '/newspack/v1/wizard/newspack-subscriptions-onboarding-wizard/fields' } )
			.then( fields => {
				this.setState( {
					fields,
					error: false,
				} );
			} )
			.catch( error => {
				this.setState( {
					error,
				} );
			} );
	}

	/**
	 * Get the latest saved info about business location.
	 */
	refreshLocationInfo() {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-subscriptions-onboarding-wizard/location',
		} )
			.then( location => {
				this.setState( {
					location,
					error: false,
				} );
			} )
			.catch( error => {
				this.setState( {
					error,
				} );
			} );
	}

	/**
	 * Save the current location info.
	 */
	saveLocation() {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-subscriptions-onboarding-wizard/location',
			method: 'post',
			data: {
				...this.state.location,
			},
		} )
			.then( response => {
				this.setState( {
					error: false,
					currentScreen: 'payment-setup',
				} );
			} )
			.catch( error => {
				this.setState( {
					error,
				} );
			} );
	}

	/**
	 * Get the latest saved Stripe settings.
	 */
	refreshStripeInfo() {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-subscriptions-onboarding-wizard/stripe-settings',
		} )
			.then( stripeSettings => {
				this.setState( {
					stripeSettings,
					error: false,
				} );
			} )
			.catch( error => {
				this.setState( {
					error,
				} );
			} );
	}

	/**
	 * Save the current Stripe settings.
	 */
	saveStripeSettings() {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-subscriptions-onboarding-wizard/stripe-settings',
			method: 'post',
			data: {
				...this.state.stripeSettings,
			},
		} )
			.then( response => {
				this.setState(
					{
						error: false,
					},
					() => ( window.location = newspack_urls[ 'checklists' ][ 'memberships' ] )
				);
			} )
			.catch( error => {
				this.setState( {
					error: error,
				} );
			} );
	}

	/**
	 * Render.
	 */
	render() {
		const { currentScreen, location, stripeSettings, fields, error } = this.state;

		let heading = '';
		let subHeading = '';
		switch ( currentScreen ) {
			case 'location-setup':
				heading = __( 'About your publication' );
				subHeading = __( 'This information is required for accepting payments' );
				break;
			case 'payment-setup':
				heading = __( 'Set up Stripe' );
				subHeading = __( 'Stripe is the recommended gateway for accepting payments' );
				break;
		}

		return (
			<Fragment>
				{ heading && <FormattedHeader headerText={ heading } subHeaderText={ subHeading } /> }
				<Wizard
					requiredPlugins={ REQUIRED_PLUGINS }
					activeScreen={ currentScreen }
					requiredPluginsCancelText={ __( 'Back to checklist' ) }
					onRequiredPluginsCancel={ () =>
						( window.location = newspack_urls[ 'checklists' ][ 'memberships' ] )
					}
					onPluginRequirementsMet={ () => this.onWizardReady() }
					error={ error }
				>
					<WizardScreen
						identifier="location-setup"
						completeButtonText={ __( 'Continue' ) }
						onCompleteButtonClicked={ () => this.saveLocation() }
					>
						<LocationSetup
							countrystateFields={ fields.countrystate }
							currencyFields={ fields.currency }
							location={ location }
							onChange={ location => this.setState( { location } ) }
						/>
					</WizardScreen>
					<WizardScreen
						identifier="payment-setup"
						completeButtonText={ __( 'Finish' ) }
						onCompleteButtonClicked={ () => this.saveStripeSettings() }
					>
						<PaymentSetup
							stripeSettings={ stripeSettings }
							onChange={ stripeSettings => this.setState( { stripeSettings } ) }
						/>
					</WizardScreen>
				</Wizard>
			</Fragment>
		);
	}
}
render(
	<SubscriptionsOnboardingWizard />,
	document.getElementById( 'newspack-subscriptions-onboarding-wizard' )
);
