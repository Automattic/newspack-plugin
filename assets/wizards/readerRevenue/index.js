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
import { Donation, LocationSetup, PaymentSetup, RevenueMain } from './views';

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
				paymentData: {},
				donationData: {},
			},
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {};

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { data } = this.state;
		const { locationData, paymentData, donationData } = data;
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
				label: __( 'Payment Setup' ),
				path: '/payment-setup',
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
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbedNavigation }
									onChange={ locationData => this.setState( { data: { ...data, locationData } } ) }
								/>
							) }
						/>
						<Route
							path="/payment-setup"
							render={ routeProps => (
								<PaymentSetup
									data={ paymentData }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbedNavigation }
									onChange={ paymentData => this.setState( { data: { ...data, paymentData } } ) }
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
