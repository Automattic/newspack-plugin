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
import { AdUnit, AdUnits, Settings, Placements, Suppression } from './views';
import { DEFAULT_SIZES as adUnitSizes } from './components/ad-unit-size-control';
import './style.scss';

const { HashRouter, Redirect, Route, Switch } = Router;
const CREATE_AD_ID_PARAM = 'create';

class AdvertisingWizard extends Component {
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

	fetchAdvertisingData = ( quiet = false ) =>
		this.updateWithAPI( { path: '/newspack/v1/wizard/advertising', quiet } );

	toggleService = ( service, enabled ) =>
		this.updateWithAPI( {
			path: '/newspack/v1/wizard/advertising/service/' + service,
			method: enabled ? 'POST' : 'DELETE',
			quiet: true,
		} );

	/**
	 * Update a single ad unit.
	 */
	onAdUnitChange = adUnit => {
		const { advertisingData } = this.state;
		advertisingData.adUnits[ adUnit.id ] = adUnit;
		this.setState( { advertisingData } );
	};

	saveAdUnit = id =>
		this.updateWithAPI( {
			path: '/newspack/v1/wizard/advertising/ad_unit/' + ( id || 0 ),
			method: 'post',
			data: this.state.advertisingData.adUnits[ id ],
			quiet: true,
		} );

	/**
	 * Delete an ad unit.
	 *
	 * @param {number} id Ad Unit ID.
	 */
	deleteAdUnit = id => {
		// eslint-disable-next-line no-alert
		if ( confirm( __( 'Are you sure you want to archive this ad unit?', 'newspack' ) ) ) {
			return this.updateWithAPI( {
				path: '/newspack/v1/wizard/advertising/ad_unit/' + id,
				method: 'delete',
				quiet: true,
			} );
		}
	};

	updateAdSuppression = suppressionConfig =>
		this.updateWithAPI( {
			path: '/newspack/v1/wizard/advertising/suppression',
			method: 'post',
			data: { config: suppressionConfig },
			quiet: true,
		} );

	/**
	 * Render
	 */
	render() {
		const { advertisingData } = this.state;
		const { pluginRequirements, wizardApiFetch } = this.props;
		const { services, adUnits } = advertisingData;
		const tabs = [
			{
				label: __( 'Google Ad Manager', 'newspack' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Ad Placements', 'newspack' ),
				path: '/placements',
			},
			{
				label: __( 'Settings', 'newspack' ),
				path: '/settings',
			},
			{
				label: __( 'Suppression', 'newspack' ),
				path: '/suppression',
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
								<AdUnits
									headerText="Advertising"
									subHeaderText={ __(
										'Configure the Google Ad Manager Ad Units for your site',
										'newspack'
									) }
									toggleService={ this.toggleService }
									adUnits={ adUnits }
									service={ 'google_ad_manager' }
									serviceData={ services.google_ad_manager }
									onDelete={ id => this.deleteAdUnit( id ) }
									buttonText={
										services.google_ad_manager.enabled ? __( 'Add New Ad Unit', 'newspack' ) : null
									}
									buttonAction={ `#/google_ad_manager/${ CREATE_AD_ID_PARAM }` }
									wizardApiFetch={ wizardApiFetch }
									fetchAdvertisingData={ this.fetchAdvertisingData }
									updateWithAPI={ this.updateWithAPI }
									updateAdUnit={ adUnit => {
										this.onAdUnitChange( adUnit );
										this.saveAdUnit( adUnit.id );
									} }
									tabbedNavigation={ tabs }
								/>
							) }
						/>
						<Route
							path="/placements"
							render={ () => (
								<Placements
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __(
										'Define global advertising placements to serve ad units on your site',
										'newspack'
									) }
									tabbedNavigation={ tabs }
								/>
							) }
						/>
						<Route
							path="/settings"
							render={ () => (
								<Settings
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __(
										'Configure display and advanced settings for your ads',
										'newspack'
									) }
									tabbedNavigation={ tabs }
								/>
							) }
						/>
						<Route
							path="/google_ad_manager"
							exact
							render={ () => (
								<AdUnits
									headerText="Google Ad Manager"
									subHeaderText={ __(
										'Monetize your content through Google Ad Manager',
										'newspack'
									) }
									adUnits={ adUnits }
									service={ 'google_ad_manager' }
									serviceData={ services.google_ad_manager }
									onDelete={ id => this.deleteAdUnit( id ) }
									wizardApiFetch={ wizardApiFetch }
									fetchAdvertisingData={ this.fetchAdvertisingData }
									updateWithAPI={ this.updateWithAPI }
								/>
							) }
						/>
						<Route
							path={ `/google_ad_manager/${ CREATE_AD_ID_PARAM }` }
							render={ routeProps => (
								<AdUnit
									headerText={ __( 'Add New Ad Unit', 'newspack' ) }
									subHeaderText={ __( 'Allows you to place ads on your site', 'newspack' ) }
									adUnit={
										adUnits[ 0 ] || {
											id: 0,
											name: '',
											code: '',
											sizes: [ adUnitSizes[ 0 ] ],
											fluid: false,
										}
									}
									service={ 'google_ad_manager' }
									serviceData={ services.google_ad_manager }
									wizardApiFetch={ wizardApiFetch }
									onChange={ this.onAdUnitChange }
									onSave={ id =>
										this.saveAdUnit( id )
											.then( () => {
												routeProps.history.push( '/google_ad_manager' );
											} )
											.catch( () => {} )
									}
								/>
							) }
						/>
						<Route
							path="/google_ad_manager/:id"
							render={ routeProps => {
								const adId = routeProps.match.params.id;
								return (
									<AdUnit
										headerText={ __( 'Edit Ad Unit', 'newspack' ) }
										subHeaderText={ __( 'Allows you to place ads on your site', 'newspack' ) }
										adUnit={ adUnits[ adId ] || {} }
										service={ 'google_ad_manager' }
										onChange={ this.onAdUnitChange }
										onSave={ id =>
											this.saveAdUnit( id ).then( () => {
												routeProps.history.push( '/google_ad_manager' );
											} )
										}
									/>
								);
							} }
						/>
						<Route
							path="/suppression"
							render={ () => (
								<Suppression
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __(
										'Allows you to manage site-wide ad suppression',
										'newspack'
									) }
									tabbedNavigation={ tabs }
									config={ advertisingData.suppression }
									onChange={ config => this.updateAdSuppression( config ) }
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
	createElement( withWizard( AdvertisingWizard, [ 'newspack-ads' ] ) ),
	document.getElementById( 'newspack-advertising-wizard' )
);
