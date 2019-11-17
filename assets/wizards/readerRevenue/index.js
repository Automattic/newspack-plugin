/**
 * Google Ad Manager Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';
import { ConfigureLandingPage, Donation, LocationSetup, StripeSetup, RevenueMain } from './views';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * AdUnits wizard for managing and setting up adUnits.
 */
class ReaderRevenueWizard extends Component {
	/**
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			data: {
				locationData: {},
				stripeData: {},
				donationData: {},
			},
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => this.fetch();

	/**
	 * Retrieve data model
	 */
	fetch = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-reader-revenue-wizard' } )
			.then( data => {
				return new Promise( resolve => {
					this.setState(
						{
							data: this.parseData( data ),
						},
						() => {
							setError();
							resolve( this.state );
						}
					);
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	};

	/**
	 * Update data model
	 */
	update = ( screen, data ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-reader-revenue-wizard/' + screen,
			method: 'POST',
			data: this.prepareData( screen, data ),
		} )
			.then( data => {
				return new Promise( resolve => {
					this.setState(
						{
							data: this.parseData( data ),
						},
						() => {
							setError();
							resolve( this.state );
						}
					);
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	};

	/**
	 * Parse API data
	 */
	parseData = data => ( {
		locationData: data.location_data,
		stripeData: data.stripe_data,
		donationData: data.donation_data,
		countryStateFields: data.country_state_fields,
		currencyFields: data.currency_fields,
		donationPage: data.donation_page,
	} );

	/**
	 * Prepare data for API update.
	 */
	prepareData = ( screen, data ) => {
		if ( 'donations' === screen ) {
			data.imageID = data.image ? data.image.id : 0;
		}
		return data;
	};

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { data } = this.state;
		const {
			countryStateFields,
			currencyFields,
			locationData,
			stripeData,
			donationData,
			donationPage,
		} = data;
		const tabbedNavigation = [
			{
				label: __( 'Main' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Location Setup' ),
				path: '/location-setup',
			},
			{
				label: __( 'Stripe Setup' ),
				path: '/stripe-setup',
			},
			{
				label: __( 'Donations' ),
				path: '/donations',
			},
			{
				label: __( 'Landing Page' ),
				path: '/configure-landing-page',
			},
		];
		const headerIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
			</SVG>
		);
		const headerText = __( 'Reader Revenue', 'newspack' );
		const subHeaderText = __( 'Generate revenue from your customers.' );
		const isConfigured = !! donationData.created;
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ routeProps => (
								<RevenueMain
									headerIcon={ headerIcon }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									tabbedNavigation={ isConfigured && tabbedNavigation }
									buttonText={ ! isConfigured && __( 'Get Started' ) }
									buttonAction="#location-setup"
								/>
							) }
						/>
						<Route
							path="/location-setup"
							render={ routeProps => (
								<LocationSetup
									data={ locationData }
									countryStateFields={ countryStateFields }
									currencyFields={ currencyFields }
									headerIcon={ headerIcon }
									headerText={ __( 'Set up donations' ) }
									subHeaderText={ __( "First, please provide your publication's address." ) }
									buttonText={ isConfigured ? __( 'Save Settings' ) : __( 'Continue Setup' ) }
									buttonAction={ () =>
										this.update( 'location', locationData ).then(
											data => ! isConfigured && routeProps.history.push( 'stripe-setup' )
										)
									}
									tabbedNavigation={ isConfigured && tabbedNavigation }
									onChange={ locationData => this.setState( { data: { ...data, locationData } } ) }
								/>
							) }
						/>
						<Route
							path="/stripe-setup"
							render={ routeProps => (
								<StripeSetup
									data={ stripeData }
									headerIcon={ headerIcon }
									headerText={ __( 'Set up donations' ) }
									subHeaderText={ __(
										'Next, we will help you set up a payment gateway in order to process transactions.'
									) }
									buttonText={ isConfigured ? __( 'Save Settings' ) : __( 'Continue Setup' ) }
									buttonAction={ () =>
										this.update( 'stripe', stripeData ).then(
											data => ! isConfigured && routeProps.history.push( 'donations' )
										)
									}
									tabbedNavigation={ isConfigured && tabbedNavigation }
									onChange={ stripeData => this.setState( { data: { ...data, stripeData } } ) }
								/>
							) }
						/>
						<Route
							path="/donations"
							render={ routeProps => (
								<Donation
									data={ donationData }
									headerIcon={ headerIcon }
									headerText={ __( 'Set up donations' ) }
									subHeaderText={ __( 'Configure your suggested donation presets.' ) }
									buttonText={ __( 'Save Settings' ) }
									buttonAction={ () =>
										this.update( 'donations', donationData ).then(
											data => ! isConfigured && routeProps.history.push( '/configure-landing-page' )
										)
									}
									tabbedNavigation={ isConfigured && tabbedNavigation }
									onChange={ donationData => this.setState( { data: { ...data, donationData } } ) }
								/>
							) }
						/>
						<Route
							path="/configure-landing-page"
							render={ routeProps => (
								<ConfigureLandingPage
									headerIcon={ headerIcon }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									tabbedNavigation={ isConfigured && tabbedNavigation }
									donationPage={ donationPage }
								/>
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
	createElement(
		withWizard( ReaderRevenueWizard, [
			'newspack-blocks',
			'woocommerce',
			'woocommerce-subscriptions',
			'woocommerce-name-your-price',
		] )
	),
	document.getElementById( 'newspack-reader-revenue-wizard' )
);
