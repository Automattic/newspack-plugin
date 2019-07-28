/**
 * Performance Wizard.
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
import { withWizard } from '../../components/src';
import { AddToHomeScreen, Intro, OfflineUsage, PushNotifications } from './views';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Wizard for configuring PWA features.
 */
class PerformanceWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			settings: {},
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		this.getSettings();
	};

	getSettings() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/performance' } )
			.then( settings => {
				this.setState( { settings } );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	updateSettings( ...fields ) {
		const { setError, wizardApiFetch } = this.props;
		const { settings } = this.state;
		const submitSettings = Object.keys( settings ).reduce(
			( submitSettings, key ) =>
				fields.indexOf( key ) > -1
					? { ...submitSettings, [ key ]: settings[ key ] }
					: submitSettings,
			{}
		);
		console.log( submitSettings );
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/performance',
				method: 'POST',
				data: { settings: submitSettings },
			} )
				.then( settings => {
					setError().then( () => this.setState( { settings }, () => resolve() ) );
				} )
				.catch( error => {
					setError( error ).then( () => reject() );
				} );
		} );
	}

	updateSetting = ( key, value, commit ) => {
		const { settings } = this.state;
		this.setState( { settings: { ...settings, [ key ]: value } }, () => {
			commit && this.updateSettings( key );
		} );
	};

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { settings } = this.state;
		const tabbedNavigation = [
			{
				label: __( 'AMP' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Advanced PWA Features' ),
				path: '/pwa/',
			},
		];
		const secondaryNavigation = [
			{
				label: __( 'Add to home screen' ),
				path: '/pwa/',
				exact: true,
			},
			{
				label: __( 'Offline usage' ),
				path: '/pwa/offline-usage',
			},
			{
				label: __( 'Push notifications' ),
				path: '/pwa/push-notifications',
			},
		];
		const headerText = __( 'Performance' );
		const subHeaderText = __(
			'Users engage more with an optimized website. Increase user engagement even further by setting up advanced PWA features.'
		);
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<Intro
								noCard
								headerText={ headerText }
								subHeaderText={ subHeaderText }
								tabbedNavigation={ tabbedNavigation }
							/>
						) }
					/>
					<Route
						path="/pwa"
						exact
						render={ routeProps => (
							<AddToHomeScreen
								headerText={ headerText }
								subHeaderText={ subHeaderText }
								buttonText={ __( 'Save' ) }
								buttonAction={ () => this.updateSettings( 'add_to_homescreen', 'site_icon' ) }
								settings={ settings }
								updateSetting={ this.updateSetting }
								tabbedNavigation={ tabbedNavigation }
								secondaryNavigation={ secondaryNavigation }
							/>
						) }
					/>
					<Route
						path="/pwa/offline-usage"
						render={ routeProps => (
							<OfflineUsage
								headerText={ headerText }
								subHeaderText={ subHeaderText }
								settings={ settings }
								updateSetting={ this.updateSetting }
								tabbedNavigation={ tabbedNavigation }
								secondaryNavigation={ secondaryNavigation }
							/>
						) }
					/>
					<Route
						path="/pwa/push-notifications"
						render={ routeProps => (
							<PushNotifications
								headerText={ headerText }
								subHeaderText={ subHeaderText }
								buttonText={ __( 'Save' ) }
								buttonAction={ () =>
									this.updateSettings(
										'push_notifications',
										'push_notification_server_key',
										'push_notification_sender_id'
									)
								}
								settings={ settings }
								updateSetting={ this.updateSetting }
								tabbedNavigation={ tabbedNavigation }
								secondaryNavigation={ secondaryNavigation }
							/>
						) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement( withWizard( PerformanceWizard, [ 'pwa', 'progressive-wp' ] ), {
		buttonText: __( 'Back to dashboard' ),
		buttonAction: newspack_urls[ 'dashboard' ],
	} ),
	document.getElementById( 'newspack-performance-wizard' )
);
