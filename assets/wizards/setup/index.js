/**
 * Setup Wizard. Introduces Newspack, installs required plugins, and requests some general information about the newsroom.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	About,
	ConfigurePlugins,
	Newsroom,
	Welcome,
	InstallationProgress,
	StarterContent,
} from './views/';
import { Card, withWizard, WizardPagination } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { pickBy, includes, forEach } from 'lodash';

const REQUIRED_PLUGINS = [
	'jetpack',
	'amp',
	'pwa',
	'gutenberg',
	'wordpress-seo',
	'google-site-kit',
	'newspack-blocks',
	'newspack-theme',
];

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
			starterContentProgress: null,
			starterContentTotal: null,
		};
	}

	componentDidMount = () => {
		this.retrieveProfile();
	};

	updateProfile = () => {
		const { setError, wizardApiFetch } = this.props;
		const { profile } = this.state;
		const params = { path: '/newspack/v1/profile/', method: 'POST', data: { profile } };
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( params )
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
		const { setError, wizardApiFetch } = this.props;
		const params = { path: '/newspack/v1/profile/', method: 'GET' };
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( params )
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

	retrievePluginData = plugin => {
		const { setError, wizardApiFetch } = this.props;
		const params = { path: '/newspack/v1/plugins/' + plugin, method: 'GET' };
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( params )
				.then( response => {
					const { pluginInfo } = this.state;
					this.setState( { pluginInfo: { ...pluginInfo, [ plugin ]: response } }, () =>
						resolve( response )
					);
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

	incrementStarterContentProgress = () => {
		const { starterContentProgress } = this.state;
		this.setState(
			{ starterContentProgress: starterContentProgress + 1 },
			() => this.state.starterContentProgress >= 43 && this.finish()
		);
	};

	installStarterContent = () => {
		const { setError } = this.props;
		this.setState( { starterContentProgress: 0, starterContentTotal: 43 } );
		const promises = [
			() =>
				apiFetch( {
					path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/categories`,
					method: 'post',
				} ).then( result => this.incrementStarterContentProgress() ),
		];
		for ( let x = 0; x < 40; x++ ) {
			promises.push( () =>
				apiFetch( {
					path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/post`,
					method: 'post',
				} )
					.then( result => this.incrementStarterContentProgress() )
					.catch( e => this.incrementStarterContentProgress() )
			);
		}
		promises.push( () =>
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/homepage`,
				method: 'post',
			} ).then( result => this.incrementStarterContentProgress() )
		);
		promises.push( () =>
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/theme`,
				method: 'post',
			} ).then( result => this.incrementStarterContentProgress() )
		);
		return new Promise( ( resolve, reject ) => {
			promises.reduce(
				( promise, action ) =>
					promise.then( result => action().then( Array.prototype.concat.bind( result ) ) ),
				Promise.resolve( [] )
			);
		} );
	};

	finish = () => {
		this.updateProfile().then( response =>
			this.completeSetup().then( () => ( window.location = newspack_urls.dashboard ) )
		);
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
			starterContentTotal,
			starterContentProgress,
		} = this.state;
		const installProgress = Object.keys( installedPlugins ).length;
		const installTotal = REQUIRED_PLUGINS.length;
		const routes = [
			'/',
			'/about',
			'/newsroom',
			'/installation-progress',
			'/configure-jetpack',
			'/configure-google-site-kit',
			'/starter-content',
		];
		const newsroomIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M10 16v-1H3.01L3 19c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2v-4h-7v1h-4zm10-9h-4.01V5l-2-2h-4l-2 2v2H4c-1.1 0-2 .9-2 2v3c0 1.11.89 2 2 2h6v-2h4v2h6c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-6 0h-4V5h4v2z" />
			</SVG>
		);
		const aboutIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
				<Path d="M17.5 10.5c.88 0 1.73.09 2.5.26V9.24c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99zM13 12.49v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26V11.9c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.3-4.5.83zM17.5 14.33c-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26v-1.52c-.79-.16-1.64-.24-2.5-.24z" />
			</SVG>
		);
		const configurePluginsIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0014 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z" />
			</SVG>
		);
		const starterContentIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z" />
			</SVG>
		);
		return (
			<Fragment>
				<HashRouter hashType="slash">
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
								secondaryButtonText={ __( 'Not right now' ) }
								secondaryButtonAction="/wp-admin"
								profile={ profile }
							/>
						) }
					/>
					<Route
						path="/about"
						render={ routeProps => (
							<About
								headerIcon={ aboutIcon }
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
								headerIcon={ newsroomIcon }
								headerText={ __( 'Tell us about your Newsroom' ) }
								subHeaderText={ __(
									'The description helps set the stage for the step content below'
								) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ {
									href: installationComplete ? '#/configure-jetpack' : '#/installation-progress',
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
						path="/configure-jetpack"
						render={ routeProps => {
							const plugin = 'jetpack';
							const pluginConfigured = pluginInfo[ plugin ] && pluginInfo[ plugin ].Configured;
							return (
								<ConfigurePlugins
									noBackground
									headerIcon={ configurePluginsIcon }
									headerText={ __( 'Configure Core Plugins' ) }
									subHeaderText={ __(
										'Please configure the following core plugin to start using Newspack.'
									) }
									plugin={ plugin }
									buttonText={ pluginConfigured ? __( 'Continue' ) : __( 'Configure Jetpack' ) }
									buttonAction={
										pluginConfigured ? '#/configure-google-site-kit' : { handoff: plugin }
									}
									pluginConfigured={ pluginConfigured }
									onMount={ this.retrievePluginData }
								/>
							);
						} }
					/>
					<Route
						path="/configure-google-site-kit"
						render={ routeProps => {
							const plugin = 'google-site-kit';
							const pluginConfigured = pluginInfo[ plugin ] && pluginInfo[ plugin ].Configured;
							return (
								<ConfigurePlugins
									noBackground
									headerIcon={ configurePluginsIcon }
									headerText={ __( 'Configure Core Plugins' ) }
									subHeaderText={ __(
										'Please configure the following core plugin to start using Newspack.'
									) }
									plugin={ plugin }
									buttonText={ pluginConfigured ? __( 'Continue' ) : __( 'Configure Google Site Kit' ) }
									buttonAction={ pluginConfigured ? '#/starter-content' : { handoff: plugin } }
									pluginConfigured={ pluginConfigured }
									onMount={ this.retrievePluginData }
								/>
							);
						} }
					/>
					<Route
						path="/starter-content"
						render={ routeProps => {
							return (
								<StarterContent
									headerIcon={ starterContentIcon }
									headerText={ __( 'Starter Content' ) }
									subHeaderText={ __( 'Pre-configure the site for testing and experimentation' ) }
									buttonText={ __( 'Install Starter Content' ) }
									buttonAction={ () => this.installStarterContent().then( this.finish ) }
									buttonDisabled={ starterContentProgress }
									secondaryButtonText={ starterContentProgress ? null : __( 'Not right now' ) }
									secondaryButtonAction={ this.finish }
									starterContentProgress={ starterContentProgress }
									starterContentTotal={ starterContentTotal }
								/>
							);
						} }
					/>
					<Route
						path={ [ '/' ] }
						render={ routeProps => (
							<InstallationProgress
								autoInstall={ '/' !== routeProps.location.pathname }
								hidden={ '/installation-progress' !== routeProps.location.pathname }
								noBackground
								headerText={ __( 'Installation...' ) }
								subHeaderText={ __(
									'You’re almost done. Please configure the following core plugins to start using Newspack.'
								) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ '#/configure-jetpack' }
								buttonDisabled={ ! installationComplete }
								plugins={ REQUIRED_PLUGINS }
								onStatus={ status => this.setState( { installationComplete: status.complete } ) }
							/>
						) }
					/>
					<Route
						render={ routeProps => {
							return routes.indexOf( routeProps.location.pathname ) === -1 ? (
								<Redirect to="/" />
							) : null;
						} }
					/>
					<WizardPagination routes={ routes } />
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SetupWizard ), { fullLogo: true } ),
	document.getElementById( 'newspack-setup-wizard' )
);
