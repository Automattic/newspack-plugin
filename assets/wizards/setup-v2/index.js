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
 * Material UI dependencies.
 */
import BusinessCenterIcon from '@material-ui/icons/BusinessCenter';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import SettingsIcon from '@material-ui/icons/Settings';
import StyleIcon from '@material-ui/icons/Style';
import SubjectIcon from '@material-ui/icons/Subject';

/**
 * Internal dependencies.
 */
import {
	Welcome,
} from './views/';
import { withWizard, WizardPagination } from '../../components/src';
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
		const routes = [
			'/',
			'/about',
			'/newsroom',
			'/installation-progress',
			'/configure-jetpack',
			'/configure-google-site-kit',
			'/theme-style-selection',
			'/starter-content',
		];

		// background auto installation is a nice feature, but in e2e it
		// creates an undeterministic environment, since the installation-progress
		// is not visited (https://github.com/Automattic/newspack-e2e-tests/issues/3)
		const shouldAutoInstallPlugins = routeProps =>
			newspack_aux_data.is_e2e
				? '/installation-progress' === routeProps.location.pathname
				: '/' !== routeProps.location.pathname;

		return (
			<Fragment>
				<HashRouter hashType="slash">
					<WizardPagination routes={ routes } />
					<Route
						path="/"
						exact
						render={ () => (
							<Welcome
								profile={ profile }
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
	createElement( withWizard( SetupWizard, [], { suppressLogoLink: true } ) ),
	document.getElementById( 'newspack-setup-wizard' )
);
