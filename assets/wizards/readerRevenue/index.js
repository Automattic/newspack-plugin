import '../../shared/js/public-path';

/**
 * Reader Revenue
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Icon, payment } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Donation, LocationSetup, StripeSetup, RevenueMain, Salesforce } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class ReaderRevenueWizard extends Component {
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
				salesforceData: {},
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
			.then( _data => {
				return new Promise( resolve => {
					this.setState(
						{
							data: this.parseData( _data ),
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
		salesforceData: data.salesforce_settings,
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
	 * Button handler for Salesforce wizard.
	 */
	handleSalesforce = async () => {
		const { wizardApiFetch } = this.props;
		const { data } = this.state;
		const { salesforceData } = data;
		const salesforceIsConnected = !! salesforceData.refresh_token;

		// If Salesforce is already connected, button should reset settings.
		if ( salesforceIsConnected ) {
			const defaultSettings = {
				client_id: '',
				client_secret: '',
				access_token: '',
				refresh_token: '',
				instance_url: '',
			};

			this.setState( { data: { ...data, salesforceData: defaultSettings } } );
			return this.update( 'salesforce', defaultSettings );
		}

		// Otherwise, attempt to establish a connection with Salesforce.
		const { client_id, client_secret } = salesforceData;

		if ( client_id && client_secret ) {
			const loginUrl = addQueryArgs( 'https://login.salesforce.com/services/oauth2/authorize', {
				response_type: 'code',
				client_id: encodeURIComponent( client_id ),
				client_secret: encodeURIComponent( client_secret ),
				redirect_uri: encodeURI( window.location.href ),
			} );

			// Save credentials to options table.
			await this.update( 'salesforce', salesforceData );

			// Validate credentials before redirecting.
			const valid = await wizardApiFetch( {
				path: '/newspack/v1/wizard/salesforce/validate',
				method: 'POST',
				data: {
					client_id,
					client_secret,
					redirect_uri: window.location.href,
				},
			} );

			if ( valid ) {
				return window.location.assign( loginUrl );
			}

			this.setState( {
				data: { ...data, salesforceData: { ...salesforceData, error: 'invalid_credentials' } },
			} );
		}
	};

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements, wizardApiFetch } = this.props;
		const { data } = this.state;
		const {
			countryStateFields,
			currencyFields,
			locationData,
			stripeData,
			donationData,
			donationPage,
			salesforceData,
		} = data;

		const tabbedNavigation = [
			{
				label: __( 'Monetization Services' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Address' ),
				path: '/location-setup',
			},
			{
				label: __( 'Payment Gateways' ),
				path: '/stripe-setup',
			},
		];
		const isConfigured = !! donationData.created;
		const salesforceIsConnected = !! salesforceData.refresh_token;
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ () => (
								<RevenueMain
									headerIcon={ <Icon icon={ payment } /> }
									headerText={ __( 'Reader revenue' ) }
									subHeaderText={ __( 'Generate revenue from your customers.' ) }
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
									headerIcon={ <Icon icon={ payment } /> }
									headerText={ __( 'Reader revenue' ) }
									subHeaderText={ __( "Configure your publication's address." ) }
									buttonText={ isConfigured ? __( 'Save Settings' ) : __( 'Continue Setup' ) }
									buttonAction={ () =>
										this.update( 'location', locationData ).then(
											() => ! isConfigured && routeProps.history.push( 'stripe-setup' )
										)
									}
									tabbedNavigation={ isConfigured && tabbedNavigation }
									onChange={ _locationData =>
										this.setState( { data: { ...data, locationData: _locationData } } )
									}
								/>
							) }
						/>
						<Route
							path="/stripe-setup"
							render={ routeProps => (
								<StripeSetup
									data={ stripeData }
									headerIcon={ <Icon icon={ payment } /> }
									headerText={ __( 'Reader revenue' ) }
									subHeaderText={ __( 'Configure your payment gateway to process transactions.' ) }
									buttonText={ isConfigured ? __( 'Save Settings' ) : __( 'Continue Setup' ) }
									buttonAction={ () =>
										this.update( 'stripe', stripeData ).then(
											() => ! isConfigured && routeProps.history.push( 'donations' )
										)
									}
									tabbedNavigation={ isConfigured && tabbedNavigation }
									onChange={ _stripeData =>
										this.setState( { data: { ...data, stripeData: _stripeData } } )
									}
								/>
							) }
						/>
						<Route
							path="/donations"
							render={ () => (
								<Donation
									data={ donationData }
									headerIcon={ <Icon icon={ payment } /> }
									headerText={ __( 'Set up donations' ) }
									subHeaderText={ __(
										'Configure your landing page and your suggested donation presets.'
									) }
									donationPage={ donationPage }
									buttonText={ __( 'Save Settings' ) }
									buttonAction={ () => this.update( 'donations', donationData ) }
									onChange={ _donationData =>
										this.setState( { data: { ...data, donationData: _donationData } } )
									}
									secondaryButtonText={ __( 'Back to Monetization Services', 'newspack' ) }
									secondaryButtonAction="#"
								/>
							) }
						/>
						<Route
							path="/salesforce"
							render={ routeProps => (
								<Salesforce
									routeProps={ routeProps }
									data={ salesforceData }
									headerIcon={ <Icon icon={ payment } /> }
									headerText={ __( 'Configure Salesforce', 'newspack' ) }
									isConnected={ salesforceIsConnected }
									subHeaderText={ __(
										'Connect your site with a Salesforce account to capture donor contact information.',
										'newspack'
									) }
									buttonText={
										salesforceIsConnected ? __( 'Reset', 'newspack' ) : __( 'Connect', 'newspack' )
									}
									buttonAction={ this.handleSalesforce }
									buttonDisabled={
										! salesforceIsConnected &&
										( ! salesforceData.client_id || ! salesforceData.client_secret )
									}
									onChange={ _salesforceData =>
										this.setState( { data: { ...data, salesforceData: _salesforceData } } )
									}
									secondaryButtonText={ __( 'Back to Monetization Services', 'newspack' ) }
									secondaryButtonAction="#"
									wizardApiFetch={ wizardApiFetch }
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
