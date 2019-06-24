/**
 * Setup Wizard. Introduces Newspack, installs required plugins, and requests some general information about the newsroom.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Welcome from './views/welcome/';
import About from './views/about/';
import { Card, NewspackLogo, ProgressBar, withWizard } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { pickBy, includes, forEach } from 'lodash';

const REQUIRED_PLUGINS = [ 'jetpack', 'amp', 'pwa', 'wordpress-seo' ];

/**
 * Wizard for setting up ability to take payments.
 * May have other settings added to it in the future.
 */
class SetupWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			installing: false,
			installedPlugins: [],
		};
	}

	/**
	 * Retrieve plugin information, create Promises to install them.
	 */
	initiateInstallPlugins = () => {
		const { installing } = this.state;
		/* First, check if installation has already begun */
		if ( installing ) {
			return;
		}
		this.setState( { installing: true }, () => {
			apiFetch( { path: '/newspack/v1/plugins/' } ).then( response => {
				const requiredPluginInfo = pickBy( response, ( value, key ) =>
					includes( REQUIRED_PLUGINS, key )
				);
				const installedPlugins = {};
				const pluginPromises = [];
				forEach( requiredPluginInfo, ( plugin, slug ) => {
					if ( plugin.Status !== 'active' ) {
						pluginPromises.push( this.installPlugin( slug ) );
					} else {
						installedPlugins[ slug ] = true;
					}
				} );
				this.setState( { installedPlugins }, () => Promise.all( pluginPromises ) );
			} );
		} );
	};

	/**
	 * Create Promise to install one plugin.
	 */
	installPlugin = slug => {
		const { setError } = this.props;
		const params = {
			path: `/newspack/v1/plugins/${ slug }/activate/`,
			method: 'post',
		};
		return apiFetch( params )
			.then( response => {
				const { installedPlugins } = this.state;
				installedPlugins[ slug ] = true;
				this.setState( { installedPlugins } );
			} )
			.catch( error => {
				console.log( '[Installation Error]', slug, error );
				setError( error );
			} );
	};

	/**
	 * Render.
	 */
	render() {
		const { installedPlugins, installing } = this.state;
		const installProgress = Object.keys( installedPlugins ).length;
		const installTotal = REQUIRED_PLUGINS.length;
		return (
			<Fragment>
				<NewspackLogo />
				<HashRouter hashType="slash">
					<Switch>
						<Route
							path="/"
							exact
							render={ routeProps => (
								<Welcome
									buttonText={ __( 'Get started' ) }
									buttonAction={ {
										href: '#/about',
										onClick: () => this.initiateInstallPlugins(),
									} }
								/>
							) }
						/>
						<Redirect to="/" />
					</Switch>
				</HashRouter>
				{ !! installing && (
					<Card noBackground>
						<ProgressBar completed={ installProgress } total={ installTotal } />
						{ installProgress < installTotal && (
							<p className="newspack-setup-wizard_progress_bar_explainer">
								{ __(
									"We're installing the core plugins and Newspack theme in the background. You can navigate away from this page"
								) }
							</p>
						) }
						{ installProgress === installTotal && (
							<p className="newspack-setup-wizard_progress_bar_explainer">
								{ __(
									"Plugin installation is complete!"
								) }
							</p>
						) }
					</Card>
				) }
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SetupWizard ) ),
	document.getElementById( 'newspack-setup-wizard' )
);
