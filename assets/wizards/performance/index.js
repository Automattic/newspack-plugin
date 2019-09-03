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
import { Intro } from './views';
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
								settings={ settings }
								updateSetting={ this.updateSetting }
								buttonText={ __( 'Save' ) }
								buttonAction={ () => {
									this.updateSettings( 'add_to_homescreen', 'site_icon' ).then( () => ( window.location = newspack_urls[ 'dashboard' ] ) )
								} }
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
