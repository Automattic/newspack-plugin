/**
 * Google Ad Manager Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, Grid, TabbedNavigation, withWizard, Button } from '../../components/src';
import { AdUnit, AdUnits, AdSense, HeaderCode, Placements, Services } from './views';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * AdUnits wizard for managing and setting up adUnits.
 */
class AdvertisingWizard extends Component {
	/**
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
	 * Update header code.
	 */
	updateHeaderCode = ( code, service ) => {
		const { advertisingData } = this.state;
		advertisingData.services[ service ].header_code = code;
		this.setState( { advertisingData } );
	};

	/**
	 * Save header code.
	 */
	saveHeaderCode = service => {
		const { setError, wizardApiFetch } = this.props;
		const { advertisingData } = this.state;
		const header_code = advertisingData.services[ service ].header_code;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/service/' + service + '/header_code',
				method: 'post',
				data: {
					header_code,
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
	savePlacement = ( placement, adUnit ) => {
		const { setError, wizardApiFetch } = this.props;
		const { advertisingData } = this.state;
		advertisingData.placements[ placement ] = adUnit;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/placement/' + placement + '/ad_unit',
				method: 'post',
				data: {
					ad_unit: adUnit,
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
		const { name, ad_code, amp_ad_code } = adUnit;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/advertising/ad_unit/' + ( id || 0 ),
				method: 'post',
				data: {
					id,
					name,
					ad_code,
					amp_ad_code,
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
									noBackground
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising.' ) }
									services={ services }
									toggleService={ ( service, value ) => this.toggleService( service, value ) }
									tabs={ tabs }
									footer={
										<p>
											{ __( 'Not sure which ad service is right for you?' ) }
											<ExternalLink url="#">{ __( 'Learn more' ) }</ExternalLink>
										</p>
									}
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
								/>
							) }
						/>
						<Route
							path="/ad-placements"
							render={ routeProps => (
								<Placements
									headerText={ __( 'Advertising', 'newspack' ) }
									subHeaderText={ __( 'Monetize your content through advertising.' ) }
									placements={ placements }
									adUnits={ adUnits }
									onChange={ ( placement, adUnit ) => this.savePlacement( placement, adUnit ) }
									togglePlacement={ ( placement, value ) =>
										this.togglePlacement( placement, value )
									}
									tabs={ tabs }
									secondaryButtonText={ __( 'Back to all ad units' ) }
									secondaryButtonAction="#/"
									secondaryButtonStyle={ { isDefault: true } }
								/>
							) }
						/>
						<Route
							path="/google_ad_manager"
							exact
							render={ routeProps => (
								<AdUnits
									noBackground
									headerText={ __( 'Google Ad Manager', 'newspack' ) }
									adUnits={ adUnits }
									tabs={ gam_tabs }
									service={ 'google_ad_manager' }
									onDelete={ id => this.deleteAdUnit( id ) }
									buttonText={ __( 'Add an individual ad unit' ) }
									buttonAction="#/google_ad_manager/create"
									secondaryButtonText={ __( "I'm done configuring ads" ) }
									secondaryButtonAction="#/"
									secondaryButtonStyle={ { isTertiary: true } }
								/>
							) }
						/>
						<Route
							path="/google_ad_manager-global-codes"
							exact
							render={ routeProps => (
								<HeaderCode
									headerText={ __( 'Google Ad Manager', 'newspack' ) }
									adUnits={ adUnits }
									code={ advertisingData.services.google_ad_manager.header_code }
									tabs={ gam_tabs }
									service={ 'google_ad_manager' }
									onChange={ value => this.updateHeaderCode( value, 'google_ad_manager' ) }
									buttonText={ __( 'Save' ) }
									buttonAction={ () =>
										this.saveHeaderCode( 'google_ad_manager' ).then( response =>
											routeProps.history.push( '/google_ad_manager' )
										)
									}
									secondaryButtonText={ __( "I'm done" ) }
									secondaryButtonAction="#/google_ad_manager"
									secondaryButtonStyle={ { isTertiary: true } }
								/>
							) }
						/>
						<Route
							path="/google_ad_manager/create"
							render={ routeProps => {
								return (
									<AdUnit
										headerText={ __( 'Add an ad unit' ) }
										subHeaderText={ __(
											'Setting up individual ad units allows you to place ads on your site through our Google Ad Manager Gutenberg block.'
										) }
										adUnit={
											adUnits[ 0 ] || {
												id: 0,
												name: '',
												ad_code: '',
												amp_ad_code: '',
											}
										}
										service={ 'google_ad_manager' }
										tabs={ gam_tabs }
										onChange={ this.onAdUnitChange }
										onSave={ id =>
											this.saveAdUnit( id ).then( newAdUnit => {
												routeProps.history.push( '/google_ad_manager' );
											} )
										}
										noBackground
									/>
								);
							} }
						/>
						<Route
							path="/google_ad_manager/:id"
							render={ routeProps => {
								return (
									<AdUnit
										headerText={ __( 'Edit ad unit' ) }
										subHeaderText={ __(
											'Setting up individual ad units allows you to place ads on your site through our Google Ad Manager Gutenberg block.'
										) }
										adUnit={ adUnits[ routeProps.match.params.id ] || {} }
										tabs={ gam_tabs }
										service={ 'google_ad_manager' }
										onChange={ this.onAdUnitChange }
										onSave={ adUnit =>
											this.saveAdUnit( adUnit ).then( newAdUnit => {
												routeProps.history.push( '/google_ad_manager' );
											} )
										}
										noBackground
									/>
								);
							} }
						/>
						<Route
							path="/google_adsense"
							render={ routeProps => (
								<Fragment>
									<AdSense
										headerText={ __( 'Google AdSense' ) }
										subHeaderText={ __(
											'Connect to your AdSense account using the Site Kit plugin, then enable Auto Ads.'
										) }
										noBackground
										secondaryButtonText={ __( 'Back to advertising options' ) }
										secondaryButtonAction="#/"
										secondaryButtonStyle={ { isTertiary: true } }
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
