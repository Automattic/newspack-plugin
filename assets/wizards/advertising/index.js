/**
 * Advertising
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies.
 */
import HeaderIcon from '@material-ui/icons/FeaturedVideo';

/**
 * Internal dependencies.
 */
import { Card, Grid, TabbedNavigation, withWizard, Button } from '../../components/src';
import { AdUnit, AdUnits, AdSense, HeaderCode, Placements, Services } from './views';

/**
 * External dependencies.
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

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
					archives: {},
					search_results: {},
				},
				services: {
					google_ad_manager: {},
					google_adsense: {},
					wordads: {},
				},
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
	fetchAdvertisingData = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/advertising' } )
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
	 * Update GAM Network Code.
	 */
	updateNetworkCode = ( code, service ) => {
		const { advertisingData } = this.state;
		advertisingData.services[ service ].network_code = code;
		this.setState( { advertisingData } );
	};

	/**
	 * Save Network Code.
	 */
	saveNetworkCode = service => {
		const { setError, wizardApiFetch } = this.props;
		const { advertisingData } = this.state;
		const network_code = advertisingData.services[ service ].network_code;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/service/' + service + '/network_code',
				method: 'post',
				data: {
					network_code,
				},
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
		const adUnit = adUnits[ id ];
		const { name, code, sizes, ad_service } = adUnit;
		const data = {
			id,
			code,
			name,
			sizes,
			ad_service,
		};
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/ad_unit/' + ( id || 0 ),
				method: 'post',
				data,
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
	 * @param int id Ad Unit ID.
	 */
	deleteAdUnit( id ) {
		const { setError, wizardApiFetch } = this.props;
		if ( confirm( __( 'Are you sure you want to delete this ad unit?' ) ) ) {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/ad_unit/' + id,
				method: 'delete',
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

	prepareData = data => {
		return {
			services: data.services,
			placements: data.placements,
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
		const { pluginRequirements } = this.props;
		const { services, placements, adUnits } = advertisingData;
		const tabs = [
			{
				label: __( 'Ad Providers' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Global Settings' ),
				path: '/ad-placements',
			},
		];
		const gam_tabs = [
			{
				label: __( 'Individual Ad Units' ),
				path: '/google_ad_manager',
			},
			{
				label: __( 'Global Code' ),
				path: '/google_ad_manager-global-codes',
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
							render={ routeProps => (
								<Services
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising.' ) }
									services={ services }
									toggleService={ ( service, value ) => this.toggleService( service, value ) }
									tabbedNavigation={ tabs }
									buttonText={ __( 'Back to dashboard' ) }
									buttonAction={ window && window.newspack_urls.dashboard }
								/>
							) }
						/>
						<Route
							path="/ad-placements"
							render={ routeProps => (
								<Placements
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising.' ) }
									placements={ placements }
									adUnits={ adUnits }
									services={ services }
									onChange={ ( placement, data ) => this.savePlacement( placement, data ) }
									togglePlacement={ ( placement, value ) =>
										this.togglePlacement( placement, value )
									}
									tabbedNavigation={ tabs }
									buttonText={ __( 'Back to ad providers' ) }
									buttonAction="#/"
								/>
							) }
						/>
						<Route
							path="/google_ad_manager"
							exact
							render={ routeProps => (
								<AdUnits
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Google Ad Manager', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising.' ) }
									adUnits={ adUnits }
									tabbedNavigation={ gam_tabs }
									service={ 'google_ad_manager' }
									onDelete={ id => this.deleteAdUnit( id ) }
									buttonText={ __( 'Add an individual ad unit' ) }
									buttonAction="#/google_ad_manager/create"
									secondaryButtonText={ __( 'Back to advertising options' ) }
									secondaryButtonAction="#/"
								/>
							) }
						/>
						<Route
							path="/google_ad_manager-global-codes"
							exact
							render={ routeProps => (
								<HeaderCode
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Google Ad Manager', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising.' ) }
									adUnits={ adUnits }
									code={ advertisingData.services.google_ad_manager.network_code }
									tabbedNavigation={ gam_tabs }
									service={ 'google_ad_manager' }
									onChange={ value => this.updateNetworkCode( value, 'google_ad_manager' ) }
									buttonText={ __( 'Save' ) }
									buttonAction={ () =>
										this.saveNetworkCode( 'google_ad_manager' ).then( response =>
											routeProps.history.push( '/google_ad_manager' )
										)
									}
									secondaryButtonText={ __( "I'm done configuring ads" ) }
									secondaryButtonAction="#/google_ad_manager"
								/>
							) }
						/>
						<Route
							path="/google_ad_manager/create"
							render={ routeProps => {
								return (
									<AdUnit
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Add an ad unit' ) }
										subHeaderText={ __(
											'Setting up individual ad units allows you to place ads on your site through our Google Ad Manager Gutenberg block.'
										) }
										adUnit={
											adUnits[ 0 ] || {
												id: 0,
												name: '',
												code: '',
												sizes: [ [ 120, 120 ] ],
											}
										}
										service={ 'google_ad_manager' }
										onChange={ this.onAdUnitChange }
										onSave={ id =>
											this.saveAdUnit( id ).then( newAdUnit => {
												routeProps.history.push( '/google_ad_manager' );
											} )
										}
									/>
								);
							} }
						/>
						<Route
							path="/google_ad_manager/:id"
							render={ routeProps => {
								return (
									<AdUnit
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Edit ad unit' ) }
										subHeaderText={ __(
											'Setting up individual ad units allows you to place ads on your site through our Google Ad Manager Gutenberg block.'
										) }
										adUnit={ adUnits[ routeProps.match.params.id ] || {} }
										service={ 'google_ad_manager' }
										onChange={ this.onAdUnitChange }
										onSave={ id =>
											this.saveAdUnit( id ).then( newAdUnit => {
												routeProps.history.push( '/google_ad_manager' );
											} )
										}
									/>
								);
							} }
						/>
						<Route
							path="/google_adsense"
							render={ routeProps => (
								<Fragment>
									<AdSense
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Google AdSense' ) }
										subHeaderText={ __(
											'Connect to your AdSense account using the Site Kit plugin, then enable Auto Ads.'
										) }
										buttonText={ __( 'Back to advertising options' ) }
										buttonAction="#/"
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
	createElement( withWizard( AdvertisingWizard, [ 'newspack-ads' ] ) ),
	document.getElementById( 'newspack-advertising-wizard' )
);
