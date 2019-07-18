/**
 * Reader revenue onboarding Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LocationSetup from './views/locationSetup';
import PaymentSetup from './views/paymentSetup';
import { withWizard } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Wizard for setting up ability to take payments.
 * May have other settings added to it in the future.
 */
class ReaderRevenueOnboardingWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
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
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		this.refreshFieldOptions();
		this.refreshLocationInfo();
		this.refreshStripeInfo();
	};

	/**
	 * Get information used for populating complex dropdown menus.
	 */
	refreshFieldOptions() {
		const { setError, wizardApiFetch } = this.props;
		wizardApiFetch( { path: '/newspack/v1/wizard/newspack-reader-revenue-onboarding-wizard/fields' } )
			.then( fields => {
				setError();
				this.setState( {
					fields,
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Get the latest saved info about business location.
	 */
	refreshLocationInfo() {
		const { setError, wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-reader-revenue-onboarding-wizard/location',
		} )
			.then( location => {
				setError();
				this.setState( {
					location,
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Save the current location info.
	 */
	saveLocation() {
		const { setError, wizardApiFetch } = this.props;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/newspack-reader-revenue-onboarding-wizard/location',
				method: 'post',
				data: {
					...this.state.location,
				},
			} )
				.then( response => {
					setError().then( () => resolve() );
				} )
				.catch( error => {
					setError( error ).then( () => reject() );
				} );
		} );
	}

	/**
	 * Get the latest saved Stripe settings.
	 */
	refreshStripeInfo() {
		const { setError, wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-reader-revenue-onboarding-wizard/stripe-settings',
		} )
			.then( stripeSettings => {
				setError();
				this.setState( {
					stripeSettings,
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Save the current Stripe settings.
	 */
	saveStripeSettings() {
		const { setError, wizardApiFetch } = this.props;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/newspack-reader-revenue-onboarding-wizard/stripe-settings',
				method: 'post',
				data: {
					...this.state.stripeSettings,
				},
			} )
				.then( response => {
					setError().then( () => resolve() );
				} )
				.catch( error => {
					setError( error ).then( () => reject() );
				} );
		} );
	}

	/**
	 * Mark this wizard as complete.
	 */
	markWizardComplete() {
		const { setError, wizardApiFetch } = this.props;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizards/reader-revenue-onboarding/complete',
				method: 'post',
				data: {},
			} )
				.then( response => {
					setError().then( () => resolve() );
				} )
				.catch( error => {
					setError( error ).then( () => reject() );
				} );
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { location, stripeSettings, fields } = this.state;
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<Fragment>
								<LocationSetup
									headerText={ __( 'About your publication' ) }
									subHeaderText={ __( 'This information is required for accepting payments' ) }
									countrystateFields={ fields.countrystate }
									currencyFields={ fields.currency }
									location={ location }
									onChange={ location => this.setState( { location } ) }
									buttonText={ __( 'Save' ) }
									buttonAction={ () =>
										this.saveLocation().then(
											() => routeProps.history.push( '/stripe' ),
											() => null
										)
									}
								/>
							</Fragment>
						) }
					/>
					<Route
						path="/stripe"
						render={ routeProps => (
							<Fragment>
								<PaymentSetup
									headerText={ __( 'Set up Stripe' ) }
									subHeaderText={ __( 'Stripe is the recommended gateway for accepting payments' ) }
									stripeSettings={ stripeSettings }
									onChange={ stripeSettings => this.setState( { stripeSettings } ) }
									buttonText={ __( 'Finish' ) }
									buttonAction={ () =>
										this.saveStripeSettings()
											.then( () => this.markWizardComplete()
												.then(
													() => ( window.location = newspack_urls[ 'checklists' ][ 'reader-revenue' ] )
												)
											)
									}
								/>
							</Fragment>
						) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement( withWizard( ReaderRevenueOnboardingWizard, [ 'woocommerce' ] ), {
		buttonText: __( 'Back to checklist' ),
		buttonAction: newspack_urls[ 'checklists' ][ 'reader-revenue' ],
	} ),
	document.getElementById( 'newspack-reader-revenue-onboarding-wizard' )
);
