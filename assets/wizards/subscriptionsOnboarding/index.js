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
import {
	PluginInstaller,
	Card,
	FormattedHeader,
	Modal,
	Button,
	withWizard,
} from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

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
	componentDidUpdate( prevProps, prevState ) {
		const { error, pluginRequirementsMet } = this.state;

		if ( error ) {
			return;
		}

		if ( ! prevState.pluginRequirementsMet && this.state.pluginRequirementsMet ) {
			this.refreshFieldOptions();
			this.refreshLocationInfo();
			this.refreshStripeInfo();
		}
	}

	/**
	 * Render any errors that need rendering.
	 *
	 * @return null | React object
	 */
	getError() {
		const { error } = this.state;
		if ( ! error ) {
			return null;
		}
		const { level } = error;
		if ( 'fatal' === level ) {
			return this.getFatalError( error );
		}

		return this.getErrorNotice( error );
	}

	/**
	 * Get a notice-level error.
	 *
	 * @param Error object already parsed by parseError
	 * @return React object
	 */
	getErrorNotice( error ) {
		const { message } = error;
		return (
			<div className="notice notice-error notice-alt update-message">
				<p>{ message }</p>
			</div>
		);
	}

	/**
	 * Get a fatal-level error.
	 *
	 * @param Error object already parsed by parseError
	 * @return React object
	 */
	getFatalError( error ) {
		const { message } = error;
		return (
			<Modal
				title={ __( 'Unrecoverable error' ) }
				onRequestClose={ () => console.log( 'Redirect to checklist now' ) }
			>
				<p>
					<strong>{ message }</strong>
				</p>
				<Button isPrimary onClick={ () => this.setState( { modalShown: false } ) }>
					{ __( 'Return to checklist' ) }
				</Button>
			</Modal>
		);
	}

	/**
	 * Parse an error caught by an API request.
	 *
	 * @param Raw error object
	 * @return Error object with relevant fields and defaults
	 */
	parseError( error ) {
		const { data, message, code } = error;
		let level = 'fatal';
		if ( !! data && 'level' in data ) {
			level = data.level;
		} else if ( 'rest_invalid_param' === code ) {
			level = 'notice';
		}

		return {
			message,
			level,
		};
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
					error: this.parseError( error ),
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
					error: this.parseError( error ),
				} );
			} );
	}

	/**
	 * Save the current location info.
	 */
	saveLocation() {
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/newspack/v1/wizard/newspack-subscriptions-onboarding-wizard/location',
				method: 'post',
				data: {
					...this.state.location,
				},
			} )
				.then( response => {
					this.setState(
						{
							error: false,
						},
						() => {
							resolve();
						}
					);
				} )
				.catch( error => {
					this.setState(
						{
							error: this.parseError( error ),
						},
						() => {
							reject();
						}
					);
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
					error: this.parseError( error ),
				} );
			} );
	}

	/**
	 * Save the current Stripe settings.
	 */
	saveStripeSettings() {
		return new Promise( ( resolve, reject ) => {
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
						() => {
							resolve();
						}
					);
				} )
				.catch( error => {
					this.setState(
						{
							error: this.parseError( error ),
						},
						() => {
							reject();
						}
					);
				} );
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const { error, pluginRequirements } = this.props;
		const { location, stripeSettings, fields } = this.state;
		return (
			<Fragment>
				{ error }
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ routeProps => (
								<Fragment>
									{ error }
									<LocationSetup
										countrystateFields={ fields.countrystate }
										currencyFields={ fields.currency }
										location={ location }
										onChange={ location => this.setState( { location } ) }
										onClickContinue={ () =>
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
									{ error }
									<PaymentSetup
										stripeSettings={ stripeSettings }
										onChange={ stripeSettings => this.setState( { stripeSettings } ) }
										onClickFinish={ () =>
											this.saveStripeSettings().then(
												() => ( window.location = newspack_urls[ 'checklists' ][ 'memberships' ] )
											)
										}
									/>
								</Fragment>
							) }
						/>
						<Redirect to="/" />
					</Switch>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SubscriptionsOnboardingWizard, [ 'woocommerce' ] ) ),
	document.getElementById( 'newspack-subscriptions-onboarding-wizard' )
);
