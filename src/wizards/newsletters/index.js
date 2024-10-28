import '../../shared/js/public-path';

/**
 * Advertising
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Settings, Tracking } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class NewslettersWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			advertisingData: {
				adUnits: {},
				services: {
					google_ad_manager: {
						status: {},
					},
				},
				suppression: false,
			},
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		this.fetchAdvertisingData();
	};

	updateWithAPI = requestConfig =>
		this.props
			.wizardApiFetch( requestConfig )
			.then(
				response =>
					new Promise( resolve => {
						this.setState(
							{
								advertisingData: {
									...response,
									adUnits: response.ad_units.reduce( ( result, value ) => {
										result[ value.id ] = value;
										return result;
									}, {} ),
								},
							},
							() => {
								this.props.setError();
								resolve( this.state );
							}
						);
					} )
			)
			.catch( err => {
				this.props.setError( err );
				throw err;
			} );

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const tabs = [
			{
				label: __( 'Settings', 'newspack-plugin' ),
				path: '/',
			},
			{
				label: __( 'Tracking', 'newspack-plugin' ),
				path: '/tracking',
			},
		];
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ () => (
								<Settings
									headerText={ __( 'Newsletters / Settings', 'newspack-plugin' ) }
									tabbedNavigation={ tabs }
								/>
							) }
						/>
						<Route
							path="/tracking"
							render={ () => (
								<Tracking
									headerText={ __( 'Advertising / Tracking', 'newspack-plugin' ) }
									tabbedNavigation={ tabs }
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
	createElement( withWizard( NewslettersWizard, [ 'newspack-newsletters' ] ) ),
	document.getElementById( 'newspack-newsletters' )
);
