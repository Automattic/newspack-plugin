import '../../shared/js/public-path';

/**
 * Setup
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment, render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import {
	About,
	ConfigurePlugins,
	Newsroom,
	Welcome,
	InstallationProgress,
	ThemeSelection,
	StarterContent,
} from './views/';
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import './style.scss';

const { HashRouter, Redirect, Route } = Router;

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
			starterContentInstallStarted: false,
			starterContentProgress: null,
			starterContentTotal: null,
			theme: null,
		};
	}

	componentDidMount = () => {
		this.retrieveProfile();
		this.retrieveTheme();
	};

	updateProfile = () => {
		const { setError, wizardApiFetch } = this.props;
		const { profile } = this.state;
		const params = { path: '/newspack/v1/profile/', method: 'POST', data: { profile } };
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( params )
				.then( response => {
					this.setState( { profile: response.profile }, () => resolve( response ) );
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
			pluginInfo.jetpack &&
			pluginInfo.jetpack.Configured &&
			pluginInfo[ 'google-site-kit' ] &&
			pluginInfo[ 'google-site-kit' ].Configured
		);
	};

	retrieveTheme = () => {
		const { setError, wizardApiFetch } = this.props;
		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
			method: 'GET',
		};
		wizardApiFetch( params )
			.then( response => {
				this.setState( { theme: response.theme } );
			} )
			.catch( error => {
				console.log( '[Theme Fetch Error]', error );
				setError( { error } );
			} );
	};

	updateTheme = theme => {
		const { setError, wizardApiFetch } = this.props;
		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme/' + theme,
			method: 'POST',
		};
		wizardApiFetch( params )
			.then( response => {
				this.setState( { theme: response.theme } );
			} )
			.catch( error => {
				console.log( '[Theme Update Error]', error );
				setError( { error } );
			} );
	};

	incrementStarterContentProgress = () => {
		this.setState(
			( { starterContentProgress } ) => ( { starterContentProgress: starterContentProgress + 1 } ),
			() =>
				this.state.starterContentProgress >= this.state.starterContentTotal &&
				this.finishStarterContentInstall()
		);
	};

	installStarterContent = async () => {
		// there are 12 categories in starter content, this will result in one post in each for e2e
		const starterPostsCount = newspack_aux_data.is_e2e ? 12 : 40;
		this.setState( {
			starterContentInstallStarted: true,
			starterContentProgress: 0,
			starterContentTotal: starterPostsCount + 3,
		} );

		await apiFetch( {
			path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/categories`,
			method: 'post',
		} ).then( this.incrementStarterContentProgress );

		const postsPromises = [];
		for ( let x = 0; x < starterPostsCount; x++ ) {
			postsPromises.push(
				apiFetch( {
					path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/post/${ x }`,
					method: 'post',
				} )
					.then( this.incrementStarterContentProgress )
					.catch( this.incrementStarterContentProgress )
			);
		}

		await Promise.all( postsPromises );

		await apiFetch( {
			path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/homepage`,
			method: 'post',
		} ).then( this.incrementStarterContentProgress );

		await apiFetch( {
			path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/theme`,
			method: 'post',
		} ).then( this.incrementStarterContentProgress );

		this.finishStarterContentInstall();
	};

	finishStarterContentInstall = () => {
		this.updateProfile().then( () =>
			this.completeSetup().then( () => ( window.location = newspack_urls.dashboard ) )
		);
	};

	/**
	 * Render.
	 */
	render() {
		const {
			installationComplete,
			pluginInfo,
			profile,
			countries,
			currencies,
			starterContentInstallStarted,
			starterContentTotal,
			starterContentProgress,
		} = this.state;

		const routes = {
			welcome: {
				path: '/',
				title: __( 'Welcome', 'newspack' ),
			},
			settings: {
				path: '/settings',
				title: __( 'Settings', 'newspack' ),
			},
			newsroom: {
				path: '/newsroom',
				title: __( 'Newsroom', 'newspack' ),
			},
			integrations: {
				path: '/integrations',
				title: __( 'Integrations', 'newspack' ),
			},
			jetpack: {
				path: '/configure-jetpack',
				title: __( 'Jetpack', 'newspack' ),
			},
			sitekit: {
				path: '/configure-google-site-kit',
				title: __( 'Google Site Kit', 'newspack' ),
			},
			design: {
				path: '/design',
				title: __( 'Design', 'newspack' ),
			},
			starterContent: {
				path: '/starter-content',
				title: __( 'Starter Content', 'newspack' ),
			},
		};

		// background auto installation is a nice feature, but in e2e it
		// creates an undeterministic environment, since the installation-progress
		// is not visited (https://github.com/Automattic/newspack-e2e-tests/issues/3)
		const shouldAutoInstallPlugins = routeProps =>
			newspack_aux_data.is_e2e
				? routes.integrations.path === routeProps.location.pathname
				: routes.welcome.path !== routeProps.location.pathname;

		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Route
						path={ routes.welcome.path }
						exact
						render={ () => (
							<Welcome
								buttonText={ __( 'Get started' ) }
								buttonAction={ {
									href: '#' + routes.settings.path,
									onClick: () => this.updateProfile(),
								} }
								profile={ profile }
							/>
						) }
					/>
					<Route
						path={ routes.settings.path }
						render={ () => (
							<About
								headerText={ routes.settings.title }
								subHeaderText={ __( 'Configure your site with basic settings' ) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ {
									href: '#' + routes.newsroom.path,
									onClick: () => this.updateProfile(),
								} }
								profile={ profile }
								currencies={ currencies }
								countries={ countries }
								updateProfile={ ( key, value ) => {
									this.setState( { profile: { ...profile, [ key ]: value } } );
								} }
								routes={ routes }
							/>
						) }
					/>
					<Route
						path={ routes.newsroom.path }
						render={ () => (
							<Newsroom
								headerText={ __( 'Tell us about your Newsroom' ) }
								subHeaderText={ __(
									'The description helps set the stage for the step content below'
								) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ {
									href: installationComplete
										? '#' + routes.jetpack.path
										: '#' + routes.integrations.path,
									onClick: () => this.updateProfile(),
								} }
								profile={ profile }
								currencies={ currencies }
								countries={ countries }
								updateProfile={ ( key, value ) => {
									this.setState( { profile: { ...profile, [ key ]: value } } );
								} }
								routes={ routes }
							/>
						) }
					/>
					<Route
						path={ routes.jetpack.path }
						render={ () => {
							const plugin = 'jetpack';
							const pluginConfigured = pluginInfo[ plugin ] && pluginInfo[ plugin ].Configured;
							return (
								<ConfigurePlugins
									headerText={ __( 'Configure Core Plugins' ) }
									subHeaderText={ __(
										'Please configure the following core plugin to start using Newspack.'
									) }
									plugin={ plugin }
									buttonText={ pluginConfigured ? __( 'Continue' ) : __( 'Configure Jetpack' ) }
									buttonAction={
										pluginConfigured ? '#' + routes.sitekit.path : { handoff: plugin }
									}
									pluginConfigured={ pluginConfigured }
									onMount={ this.retrievePluginData }
									routes={ routes }
								/>
							);
						} }
					/>
					<Route
						path={ routes.sitekit.path }
						render={ () => {
							const plugin = 'google-site-kit';
							const pluginConfigured = pluginInfo[ plugin ] && pluginInfo[ plugin ].Configured;
							return (
								<ConfigurePlugins
									headerText={ __( 'Configure Core Plugins' ) }
									subHeaderText={ __(
										'Please configure the following core plugin to start using Newspack.'
									) }
									plugin={ plugin }
									buttonText={
										pluginConfigured ? __( 'Continue' ) : __( 'Configure Google Site Kit' )
									}
									buttonAction={ pluginConfigured ? '#' + routes.design.path : { handoff: plugin } }
									pluginConfigured={ pluginConfigured }
									onMount={ this.retrievePluginData }
									routes={ routes }
								/>
							);
						} }
					/>
					<Route
						path={ routes.design.path }
						render={ () => {
							const { theme } = this.state;
							return (
								<ThemeSelection
									headerText={ routes.design.title }
									subHeaderText={ __( 'Choose a Newspack theme' ) }
									buttonText={ __( 'Continue' ) }
									buttonAction={ '#' + routes.starterContent.path }
									updateTheme={ this.updateTheme }
									theme={ theme }
									isWide
									routes={ routes }
								/>
							);
						} }
					/>
					<Route
						path={ routes.starterContent.path }
						render={ () => {
							return (
								<StarterContent
									headerText={ routes.starterContent.title }
									subHeaderText={ __( 'Pre-configure the site for testing and experimentation' ) }
									buttonText={ __( 'Install Starter Content' ) }
									buttonAction={ this.installStarterContent }
									buttonDisabled={ starterContentInstallStarted }
									secondaryButtonText={ starterContentProgress ? null : __( 'Not right now' ) }
									secondaryButtonAction={ this.finishStarterContentInstall }
									starterContentProgress={ starterContentProgress }
									starterContentTotal={ starterContentTotal }
									displayProgressBar={ starterContentInstallStarted }
									routes={ routes }
								/>
							);
						} }
					/>
					<Route
						path={ [ '/' ] }
						render={ routeProps => (
							<InstallationProgress
								autoInstall={ shouldAutoInstallPlugins( routeProps ) }
								hidden={ routes.integrations.path !== routeProps.location.pathname }
								headerText={ routes.integrations.title }
								subHeaderText={ __(
									'Please configure the following core plugins to start using Newspack.'
								) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ '#/configure-jetpack' }
								buttonDisabled={ ! installationComplete }
								plugins={ REQUIRED_PLUGINS }
								onStatus={ status => this.setState( { installationComplete: status.complete } ) }
								routes={ routes }
							/>
						) }
					/>
					<Route
						render={ routeProps => {
							// If trying to go to an invalid route, go back to Welcome.
							return ! Object.keys( routes ).find(
								route => routes[ route ].path === routeProps.location.pathname
							) ? (
								<Redirect to={ routes.welcome.path } />
							) : null;
						} }
					/>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SetupWizard, [] ) ),
	document.getElementById( 'newspack-setup-wizard' )
);
