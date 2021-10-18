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
import { AdUnit, AdUnits, Placements, Services, Suppression } from './views';
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
				adUnits: [],
				placements: {
					global_above_header: {},
					global_below_header: {},
					global_above_footer: {},
					sticky: {},
				},
				services: {
					google_ad_manager: {
						status: {},
					},
					google_adsense: {},
					wordads: {},
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

	/**
	 * Retrieve advertising data
	 */
	fetchAdvertisingData = ( quiet = false ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/advertising', quiet } )
			.then( advertisingData => {
				return new Promise( resolve => {
					this.setState(
						{
							advertisingData: this.prepareData( advertisingData ),
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
	 * Toggle advertising service.
	 */
	toggleService( service, enabled ) {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/service/' + service,
			method: enabled ? 'POST' : 'DELETE',
			quiet: true,
		} )
			.then( advertisingData => {
				return new Promise( resolve => {
					this.setState(
						{
							advertisingData: this.prepareData( advertisingData ),
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
	}

	/**
	 * Toggle placement.
	 */
	togglePlacement( placement, enabled ) {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/placement/' + placement,
			method: enabled ? 'POST' : 'DELETE',
			quiet: true,
		} )
			.then( advertisingData => {
				return new Promise( resolve => {
					this.setState(
						{
							advertisingData: this.prepareData( advertisingData ),
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
	}

	/**
	 * Save placement.
	 */
	savePlacement = ( placement, data ) => {
		const { setError, wizardApiFetch } = this.props;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/placement/' + placement,
				method: 'post',
				data: {
					ad_unit: data.adUnit,
					service: data.service,
				},
				quiet: true,
			} )
				.then( advertisingData => {
					this.setState(
						{
							advertisingData: this.prepareData( advertisingData ),
						},
						() => {
							setError();
							resolve( this.state );
						}
					);
				} )
				.catch( error => {
					setError( error ).then( () => reject( error ) );
				} );
		} );
	};

	/**
	 * Update a single ad unit.
	 */
	onAdUnitChange = adUnit => {
		const { advertisingData } = this.state;
		advertisingData.adUnits[ adUnit.id ] = adUnit;
		this.setState( { advertisingData } );
	};

	/**
	 * Save the fields to an ad unit.
	 */
	saveAdUnit( id ) {
		const { setError, wizardApiFetch } = this.props;
		const { adUnits } = this.state.advertisingData;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/ad_unit/' + ( id || 0 ),
				method: 'post',
				data: adUnits[ id ],
				quiet: true,
			} )
				.then( advertisingData => {
					this.setState(
						{
							advertisingData: this.prepareData( advertisingData ),
						},
						() => {
							setError();
							resolve( this.state );
						}
					);
				} )
				.catch( error => {
					setError( error ).then( () => reject( error ) );
				} );
		} );
	}

	/**
	 * Delete an ad unit.
	 *
	 * @param {number} id Ad Unit ID.
	 */
	deleteAdUnit( id ) {
		const { setError, wizardApiFetch } = this.props;
		// eslint-disable-next-line no-alert
		if ( confirm( __( 'Are you sure you want to archive this ad unit?', 'newspack' ) ) ) {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/ad_unit/' + id,
				method: 'delete',
				quiet: true,
			} )
				.then( advertisingData => {
					this.setState(
						{
							advertisingData: this.prepareData( advertisingData ),
						},
						() => {
							setError();
						}
					);
				} )
				.catch( error => {
					setError( error );
				} );
		}
	}

	/**
	 * Update ad suppression settings.
	 */
	updateAdSuppression( suppressionConfig ) {
		const { setError, wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/suppression',
			method: 'post',
			data: { config: suppressionConfig },
			quiet: true,
		} )
			.then( advertisingData => {
				this.setState(
					{
						advertisingData: this.prepareData( advertisingData ),
					},
					setError
				);
			} )
			.catch( setError );
	}

	prepareData = data => {
		return {
			...data,
			adUnits: data.ad_units.reduce( ( result, value ) => {
				result[ value.id ] = value;
				return result;
			}, {} ),
		};
	};

	/**
	 * Render
	 */
	render() {
		const { advertisingData } = this.state;
		const { pluginRequirements, wizardApiFetch } = this.props;
		const { services, placements, adUnits } = advertisingData;
		const tabs = [
			{
				label: __( 'Ad Providers', 'newspack' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Global Settings', 'newspack' ),
				path: '/ad-placements',
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
								<Services
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising', 'newspack' ) }
									services={ services }
									toggleService={ ( service, value ) => this.toggleService( service, value ) }
									tabbedNavigation={ tabs }
								/>
							) }
						/>
						<Route
							path="/ad-placements"
							render={ () => (
								<Placements
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising', 'newspack' ) }
									placements={ placements }
									adUnits={ adUnits }
									services={ services }
									onChange={ ( placement, data ) => this.savePlacement( placement, data ) }
									togglePlacement={ ( placement, value ) =>
										this.togglePlacement( placement, value )
									}
									tabbedNavigation={ tabs }
								/>
							) }
						/>
						<Route
							path="/google_ad_manager"
							exact
							render={ () => (
								<AdUnits
									headerText={ __( 'Google Ad Manager', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising', 'newspack' ) }
									adUnits={ adUnits }
									service={ 'google_ad_manager' }
									serviceData={ services.google_ad_manager }
									onDelete={ id => this.deleteAdUnit( id ) }
									buttonText={ __( 'Add an ad unit', 'newspack' ) }
									buttonAction={ `#/google_ad_manager/${ CREATE_AD_ID_PARAM }` }
									secondaryButtonText={ __( 'Back to advertising options', 'newspack' ) }
									secondaryButtonAction="#/"
									wizardApiFetch={ wizardApiFetch }
									fetchAdvertisingData={ this.fetchAdvertisingData }
									updateAdUnit={ adUnit => {
										this.onAdUnitChange( adUnit );
										this.saveAdUnit( adUnit.id );
									} }
								/>
							) }
						/>
						<Route
							path={ `/google_ad_manager/${ CREATE_AD_ID_PARAM }` }
							render={ routeProps => (
								<AdUnit
									headerText={ __( 'Add an ad unit', 'newspack' ) }
									subHeaderText={ __(
										'Setting up ad units allows you to place ads on your site through our Google Ad Manager Gutenberg block.',
										'newspack'
									) }
									adUnit={
										adUnits[ 0 ] || {
											id: 0,
											name: '',
											code: '',
											sizes: [ adUnitSizes[ 0 ] ],
										}
									}
									service={ 'google_ad_manager' }
									serviceData={ services.google_ad_manager }
									wizardApiFetch={ wizardApiFetch }
									onChange={ this.onAdUnitChange }
									onSave={ id =>
										this.saveAdUnit( id ).then( () => {
											routeProps.history.push( '/google_ad_manager' );
										} )
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
										subHeaderText={ __(
											'Allows you to place ads on your site through our Ads block',
											'newspack'
										) }
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
									headerText={ __( 'Ad Suppression', 'newspack' ) }
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
