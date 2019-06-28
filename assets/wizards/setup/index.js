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
import { About, ConfigurePlugins, Newsroom, Welcome } from './views/';
import { Card, NewspackLogo, PluginInstaller, withWizard } from '../../components/src';
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

	/**
	 * Render.
	 */
	render() {
		const {
			installedPlugins,
			installationComplete,
			profile,
			countries,
			currencies,
			setupComplete,
		} = this.state;
		const installProgress = Object.keys( installedPlugins ).length;
		const installTotal = REQUIRED_PLUGINS.length;
		return (
			<Fragment>
				<NewspackLogo width="240" className="newspack-logo" />
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
									buttonText={ __( 'Continue' ) }
									buttonAction="#/configure-plugins"
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
									buttonText={ __( 'Start Configuration' ) }
									buttonAction={ {
										onClick: () =>
											this.updateProfile().then( response =>
												this.completeSetup().then(
													() => ( window.location = newspack_urls.dashboard )
												)
											),
									} }
								/>
							) }
						/>
						<Redirect to="/" />
					</Switch>
					<Route
						path={ [ '/about', '/newsroom', '/configure-plugins' ] }
						render={ routeProps => (
							<div className="newspack-setup-wizard_plugin-installer">
								<PluginInstaller
									asProgressBar
									plugins={ REQUIRED_PLUGINS }
									onComplete={ () =>
										this.setState( { installationComplete: true } )
									}
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
	createElement( withWizard( SetupWizard ) ),
	document.getElementById( 'newspack-setup-wizard' )
);
