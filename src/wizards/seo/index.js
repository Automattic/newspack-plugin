import '../../shared/js/public-path';

/**
 * SEO
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Settings } from './views';

/**
 * External dependencies.
 */
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';

const { HashRouter, Redirect, Route, Switch } = Router;

/**
 * Check whether the given object is a pure object with key/value pairs.
 *
 * @param {*} obj Object to check.
 * @return {boolean} True if an object, otherwise false.
 */
const isObj = obj =>
	null !== obj && typeof obj === 'object' && Object.getPrototypeOf( obj ).isPrototypeOf( Object );

/**
 * Recursively run the given `callback` on all keys of `obj`, and all keys of values of `obj`.
 *
 * @param {*}        obj
 * @param {Function} callback
 * @return {*} Transformed obj.
 */
const deepMapKeys = ( obj, callback ) => {
	if ( ! isObj( obj ) ) {
		return obj;
	}
	const result = {};
	for ( const key in obj ) {
		if ( obj.hasOwnProperty( key ) ) {
			result[ callback( key ) ] = deepMapKeys( obj[ key ], callback );
		}
	}

	return result;
};

class SEOWizard extends Component {
	state = {
		underConstruction: false,
		urls: {
			facebook: '',
			twitter: '',
			instagram: '',
			youtube: '',
			linkedin: '',
			pinterest: '',
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
			quiet: true,
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
		const headerText = __( 'SEO', 'newspack' );
		const subHeaderText = __( 'Configure basic SEO settings', 'newspack' );
		const buttonText = __( 'Save Settings', 'newspack' );
		const secondaryButtonText = __( 'Advanced Settings', 'newspack' );
		const screenParams = {
			data: this.state,
			headerText,
			subHeaderText,
		};
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							exact
							path="/"
							render={ () => (
								<Settings
									{ ...screenParams }
									buttonAction={ () => this.update() }
									buttonText={ buttonText }
									onChange={ settings => this.setState( settings ) }
									secondaryButtonText={ secondaryButtonText }
								/>
							) }
						/>
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
