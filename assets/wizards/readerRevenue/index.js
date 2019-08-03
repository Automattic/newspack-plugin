/**
 * Google Ad Manager Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';
import { Donation, LocationSetup, StripeSetup, RevenueMain } from './views';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * AdUnits wizard for managing and setting up adUnits.
 */
class ReaderRevenuWizard extends Component {
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
				setError();
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
		const { countryStateFields, currencyFields, locationData, stripeData, donationData } = data;
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
		];
		const headerText = __( 'Reader Revenue', 'newspack' );
		const subHeaderText = __( 'Generate revenue from your customers.' );
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
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbedNavigation }
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
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									buttonText={ __( 'Save' ) }
									buttonAction={ () => this.update( 'location', locationData ) }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbedNavigation }
									onChange={ locationData => this.setState( { data: { ...data, locationData } } ) }
								/>
							) }
						/>
						<Route
							path="/stripe-setup"
							render={ routeProps => (
								<StripeSetup
									data={ stripeData }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									buttonText={ __( 'Save' ) }
									buttonAction={ () => this.update( 'stripe', stripeData ) }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbedNavigation }
									onChange={ stripeData => this.setState( { data: { ...data, stripeData } } ) }
								/>
							) }
						/>
						<Route
							path="/donations"
							render={ routeProps => (
								<Donation
									data={ donationData }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									buttonText={ __( 'Save' ) }
									buttonAction={ () => this.update( 'donations', donationData ) }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbedNavigation }
									onChange={ donationData => this.setState( { data: { ...data, donationData } } ) }
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
	createElement( withWizard( ReaderRevenuWizard, [] ) ),
	document.getElementById( 'newspack-reader-revenue-wizard' )
);
