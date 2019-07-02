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
		const { setError } = this.props;
		return apiFetch( { path: '/newspack/v1/wizard/performance' } )
			.then( settings => {
				this.setState( { settings } );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	updateSettings( ...fields ) {
		const { setError } = this.props;
		const { settings } = this.state;
		const submitSettings = Object.keys( settings ).reduce(
			( submitSettings, key ) =>
				fields.indexOf( key ) > -1
					? { ...submitSettings, [ key ]: settings[ key ] }
					: submitSettings,
			{}
		);
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
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

	updateSetting = ( key, value ) => {
		const { settings } = this.state;
		this.setState( { settings: { ...settings, [ key ]: value } } );
	};

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { settings } = this.state;
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
								headerText={ __( 'Performance options' ) }
								subHeaderText={ __(
									'Optimizing your news site for better performance and increased user engagement.'
								) }
								buttonText={ __( 'Configure advanced options' ) }
								buttonAction="#/add-to-homescreen"
							/>
						) }
					/>
					<Route
						path="/add-to-homescreen"
						render={ routeProps => (
							<AddToHomeScreen
								headerText={ __( 'Enable Add to Homescreen' ) }
								subHeaderText={ __(
									'Encourage your users to add your news site to their homescreen.'
								) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ () =>
									this.updateSettings( 'add_to_homescreen', 'site_icon' ).then( () =>
										routeProps.history.push( '/offline-usage' )
									)
								}
								settings={ settings }
								updateSetting={ this.updateSetting }
							/>
						) }
					/>
					<Route
						path="/offline-usage"
						render={ routeProps => (
							<OfflineUsage
								headerText={ __( 'Enable Offline Usage' ) }
								subHeaderText={ __(
									'Make your website reliable. Even on flaky internet connections.'
								) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ () =>
									this.updateSettings( 'offline_usage' ).then( () =>
										routeProps.history.push( '/push-notifications' )
									)
								}
								settings={ settings }
								updateSetting={ this.updateSetting }
							/>
						) }
					/>
					<Route
						path="/push-notifications"
						render={ routeProps => (
							<PushNotifications
								headerText={ __( 'Enable Push Notifications' ) }
								subHeaderText={ __( 'Keep your users engaged by sending push notifications.' ) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ () =>
									this.updateSettings(
										'push_notifications',
										'push_notification_server_key',
										'push_notification_sender_id'
									).then( () => ( window.location = newspack_urls[ 'dashboard' ] ) )
								}
								settings={ settings }
								updateSetting={ this.updateSetting }
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
