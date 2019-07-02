/**
 * Setup Wizard. Introduces Newspack, installs required plugins, and requests some general information about the newsroom.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { About, ConfigurePlugins, Newsroom, Welcome } from './views/';
import { Card, PluginInstaller, withWizard, WizardPagination } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { pickBy, includes, forEach } from 'lodash';

const REQUIRED_PLUGINS = [ 'jetpack', 'amp', 'pwa', 'wordpress-seo', 'google-site-kit' ];

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
			installationComplete: false,
			installedPlugins: [],
			pluginInfo: {},
			setupComplete: false,
			profile: {},
			currencies: {},
			countries: {},
		};
	}

	componentDidMount = () => {
		this.retrieveProfile();
	};

	updateProfile = () => {
		const { setError } = this.props;
		const { profile } = this.state;
		const params = { path: '/newspack/v1/profile/', method: 'POST', data: { profile } };
		return new Promise( ( resolve, reject ) => {
			apiFetch( params )
				.then( response => {
					const { profile } = response;
					this.setState( { profile }, () => resolve( response ) );
				} )
				.catch( error => {
					console.log( '[Profile Update Error]', error );
					setError( { error } );
					reject( error );
				} );
		} );
	};

	retrieveProfile = () => {
		const { setError } = this.props;
		const params = { path: '/newspack/v1/profile/', method: 'GET' };
		return new Promise( ( resolve, reject ) => {
			apiFetch( params )
				.then( response => {
					const { profile, currencies, countries } = response;
					this.setState( { profile, currencies, countries }, () => resolve( response ) );
				} )
				.catch( error => {
					console.log( '[Profile Fetch Error]', error );
					setError( { error } );
					reject( error );
				} );
		} );
	};

	/**
	 * API call to set option indicating setup is complete.
	 */
	completeSetup = () => {
		const { setError } = this.props;
		const params = {
			path: `/newspack/v1/wizard/newspack-setup-wizard/complete`,
			method: 'post',
		};
		return new Promise( ( resolve, reject ) => {
			return apiFetch( params )
				.then( response => {
					this.setState( { setupComplete: true }, () => resolve( response ) );
				} )
				.catch( error => {
					console.log( '[Complete Setup Error]', error );
					setError( error );
					reject( error );
				} );
		} );
	};

	isConfigurationComplete = () => {
		const { pluginInfo } = this.state;
		return (
			pluginInfo[ 'jetpack' ] &&
			pluginInfo[ 'jetpack' ].Configured &&
			pluginInfo[ 'google-site-kit' ] &&
			pluginInfo[ 'google-site-kit' ].Configured
		);
	};

	getFirstPluginToConfigure = () => {
		const { pluginInfo } = this.state;
		if ( ! pluginInfo[ 'jetpack' ] || ! pluginInfo[ 'google-site-kit' ] ) {
			return null;
		}
		if ( ! pluginInfo[ 'jetpack' ].Configured ) {
			return { handoff: 'jetpack' };
		}
		if ( ! pluginInfo[ 'google-site-kit' ].Configured ) {
			return { handoff: 'google-site-kit' };
		}
		return null;
	};

	/**
	 * Render.
	 */
	render() {
		const {
			installedPlugins,
			installationComplete,
			pluginInfo,
			profile,
			countries,
			currencies,
			setupComplete,
		} = this.state;
		const installProgress = Object.keys( installedPlugins ).length;
		const installTotal = REQUIRED_PLUGINS.length;
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<WizardPagination routes={ [ '/', '/about', '/newsroom', '/configure-plugins' ] } />
					<Switch>
						<Route
							path="/"
							exact
							render={ routeProps => (
								<Welcome
									buttonText={ __( 'Get started' ) }
									buttonAction={ {
										href: '#/about',
										onClick: () => this.updateProfile(),
									} }
									profile={ profile }
								/>
							) }
						/>
						<Route
							path="/about"
							render={ routeProps => (
								<About
									headerText={ __( 'About your publication' ) }
									subHeaderText={ __(
										'Share a few details so we can start setting up your profile'
									) }
									buttonText={ __( 'Continue' ) }
									buttonAction={ {
										href: '#/newsroom',
										onClick: () => this.updateProfile(),
									} }
									profile={ profile }
									currencies={ currencies }
									countries={ countries }
									updateProfile={ ( key, value ) => {
										this.setState( { profile: { ...profile, [ key ]: value } } );
									} }
								/>
							) }
						/>
						<Route
							path="/newsroom"
							render={ routeProps => (
								<Newsroom
									headerText={ __( 'Tell us about your Newsroom' ) }
									subHeaderText={ __(
										'The description helps set the stage for the step content below'
									) }
									buttonText={
										installationComplete ? __( 'Continue' ) : <div>{ __( 'Plugins Installing') }<Spinner /></div>
									}
									buttonAction={ {
										href: '#/configure-plugins',
										onClick: () => this.updateProfile(),
									} }
									buttonDisabled={ ! installationComplete }
									profile={ profile }
									currencies={ currencies }
									countries={ countries }
									updateProfile={ ( key, value ) => {
										this.setState( { profile: { ...profile, [ key ]: value } } );
									} }
								/>
							) }
						/>
						<Route
							path="/configure-plugins"
							render={ routeProps => (
								<ConfigurePlugins
									noBackground
									headerText={ __( 'Configure Core Plugins' ) }
									subHeaderText={ __(
										'You’re almost done. Please configure the following core plugins to start using Newspack.'
									) }
									buttonText={
										this.isConfigurationComplete() ? __( 'Finish' ) : __( 'Start Configuration' )
									}
									buttonAction={
										this.isConfigurationComplete()
											? {
													onClick: () =>
														this.updateProfile().then( response =>
															this.completeSetup().then(
																() => ( window.location = newspack_urls.dashboard )
															)
														),
											  }
											: this.getFirstPluginToConfigure()
									}
									pluginInfoReady={ plugin => {
										const { pluginInfo } = this.state;
										this.setState( { pluginInfo: { ...pluginInfo, [ plugin.Slug ]: plugin } } );
									} }
								/>
							) }
						/>
						<Redirect to="/" />
					</Switch>
					<Route
						path={ [ '/about', '/newsroom' ] }
						render={ routeProps => (
							<div className="newspack-setup-wizard_plugin-installer">
								<PluginInstaller
									asProgressBar
									plugins={ REQUIRED_PLUGINS }
									onStatus={ status => this.setState( { installationComplete: status.complete } ) }
								/>
								{ ! installationComplete && (
									<p className="newspack-setup-wizard_progress_bar_explainer">
										{ __(
											"We're installing the core plugins and Newspack theme in the background. You can navigate away from this page"
										) }
									</p>
								) }
								{ !! installationComplete && (
									<p className="newspack-setup-wizard_progress_bar_explainer">
										{ __( 'Plugin installation is complete!' ) }
									</p>
								) }
							</div>
						) }
					/>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SetupWizard ), { fullLogo: true } ),
	document.getElementById( 'newspack-setup-wizard' )
);
