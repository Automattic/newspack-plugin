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
import { withWizard, WizardPagination } from '../../components/src';
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
		return (
			<HashRouter hashType="slash">
				<WizardPagination />
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
