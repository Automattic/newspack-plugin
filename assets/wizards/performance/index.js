/**
 * Performance
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Speed';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/proxied-imports/router'
import { Intro } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

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
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<Intro
								headerIcon={ <HeaderIcon /> }
								headerText={ __( 'Performance options' ) }
								subHeaderText={ __(
									'Optimizing your news site for better performance and increased user engagement.'
								) }
								settings={ settings }
								updateSiteIcon={ icon => this.updateSiteIcon( icon ) }
								buttonText={ __( 'Back to dashboard' ) }
								buttonAction={ window && window.newspack_urls.dashboard }
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
	createElement( withWizard( PerformanceWizard, [ 'pwa', 'progressive-wp' ] ) ),
	document.getElementById( 'newspack-performance-wizard' )
);
