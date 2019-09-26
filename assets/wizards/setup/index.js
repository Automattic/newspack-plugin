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
			() => this.state.starterContentProgress >= 7 && this.finish()
		);
	};

	installStarterContent = () => {
		const { setError } = this.props;
		this.setState( { starterContentProgress: 0, starterContentTotal: 7 } );
		const promises = [
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/categories`,
				method: 'post',
			} ).then( result => this.incrementStarterContentProgress() ),
		];
		for ( let x = 0; x < 5; x++ ) {
			promises.push(
				apiFetch( {
					path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/post`,
					method: 'post',
				} ).then( result => this.incrementStarterContentProgress() )
			);
		}
		promises.push(
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/homepage`,
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
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<WizardPagination routes={ routes } />
					<Route
						path="/"
						exact
						render={ routeProps => (
							<Welcome
								buttonText={ __( 'Install core plugins and Newspack theme' ) }
								buttonAction={ {
									href: '#/about',
									onClick: () => this.updateProfile(),
								} }
								secondaryButtonText={ __( 'Not right now' ) }
								secondaryButtonAction="/wp-admin"
								profile={ profile }
								notice=<p>
									{ __(
										'Clicking “Get Started” will install core Newspack plugins and the theme in the background.'
									) }
								</p>
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
									headerText={ __( 'Configure Core Plugins' ) }
									subHeaderText={ __(
										'You’re almost done. Please configure the following core plugins to start using Newspack.'
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
									headerText={ __( 'Configure Core Plugins' ) }
									subHeaderText={ __(
										'You’re almost done. Please configure the following core plugins to start using Newspack.'
									) }
									plugin={ plugin }
									buttonText={ pluginConfigured ? __( 'Continue' ) : __( 'Configure Site Kit' ) }
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
									headerText={ __( 'Starter Content' ) }
									subHeaderText={ __( 'Install starter content' ) }
									buttonText={ __( 'Install' ) }
									buttonAction={ () => this.installStarterContent().then( this.finish ) }
									secondaryButtonText={ __( 'Not right now' ) }
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
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SetupWizard ), { fullLogo: true } ),
	document.getElementById( 'newspack-setup-wizard' )
);
