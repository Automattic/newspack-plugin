/**
 * Performance Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';
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

	updateSiteIcon( value ) {
		const { setError, wizardApiFetch } = this.props;
		const { settings } = this.state;
		settings.site_icon = value;
		if ( ! settings.site_icon ) {
			settings.site_icon = false;
		}

		this.setState( { settings }, () => {
			return new Promise( ( resolve, reject ) => {
				wizardApiFetch( {
					path: '/newspack/v1/wizard/performance',
					method: 'POST',
					data: { settings },
				} )
					.then( settings => {
						setError().then( () => this.setState( { settings }, () => resolve() ) );
					} )
					.catch( error => {
						setError( error ).then( () => reject() );
					} );
			} );
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { settings } = this.state;
		const headerIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z" />
			</SVG>
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
								headerIcon={ headerIcon }
								headerText={ __( 'Performance options' ) }
								subHeaderText={ __(
									'Optimizing your news site for better performance and increased user engagement.'
								) }
								settings={ settings }
								updateSiteIcon={ icon => this.updateSiteIcon( icon ) }
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
