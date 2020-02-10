/**
 * SEO
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Search';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Environment, Separator, Social, Tools } from './views';

/**
 * External dependencies.
 */
import deepMapKeys from 'deep-map-keys';
import { camelCase, snakeCase } from 'lodash';

const { HashRouter, Redirect, Route, Switch } = Router;

class SEOWizard extends Component {
	state = {
		title_separator: '',
		under_construction: false,
		urls: {
			facebook: '',
			twitter: '',
			instagram: '',
			youtube: '',
			linkedin: '',
		},
		verification: {
			bing: '',
			google: '',
		},
	};

	onWizardReady = () => this.fetch();

	/**
	 * Get settings for the wizard.
	 */
	fetch() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-seo-wizard/settings',
		} )
			.then( response => this.setState( this.sanitizeResponse( response ) ) )
			.catch( error => setError( error ) );
	}
	/**
	 * Update settings.
	 */
	update() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-seo-wizard/settings',
			method: 'POST',
			data: deepMapKeys( this.state, key => snakeCase( key ) ),
		} )
			.then( response => this.setState( this.sanitizeResponse( response ) ) )
			.catch( error => setError( error ) );
	}

	/**
	 * Sanitize API response.
	 */
	sanitizeResponse = response => {
		return deepMapKeys( response, key => camelCase( key ) );
	};

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const buttonText = __( 'Save' );
		const headerIcon = <HeaderIcon />;
		const headerText = __( 'SEO', 'newspack' );
		const subHeaderText = __( 'Search engine and social optimization', 'newspack' );
		const tabbedNavigation = [
			{
				label: __( 'Environment', 'newspack' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Separator', 'newspack' ),
				path: '/separator',
				exact: true,
			},
			{
				label: __( 'Tools', 'newspack' ),
				path: '/tools',
				exact: true,
			},
			{
				label: __( 'Social', 'newspack' ),
				path: '/social',
			},
		];
		const screenParams = {
			buttonAction: () => this.update(),
			buttonText,
			data: this.state,
			headerIcon,
			headerText,
			onChange: settings => this.setState( settings ),
			subHeaderText,
			tabbedNavigation,
		};
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route path="/" exact render={ () => <Environment { ...screenParams } /> } />
						<Route path="/separator" exact render={ () => <Separator { ...screenParams } /> } />
						<Route path="/social" exact render={ () => <Social { ...screenParams } /> } />
						<Route path="/tools" exact render={ () => <Tools { ...screenParams } /> } />
						<Redirect to="/" />
					</Switch>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SEOWizard, [ 'wordpress-seo', 'jetpack' ] ) ),
	document.getElementById( 'newspack-seo-wizard' )
);
