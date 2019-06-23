/**
 * Setup Wizard. Introduces Newspack, installs required plugins, and requests some general information about the newsroom.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
 import { NewspackLogo, withWizard } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

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
	}

	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<NewspackLogo />
				<HashRouter hashType="slash">
					<Switch>
						<Redirect to="/" />
					</Switch>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SetupWizard ) ),
	document.getElementById( 'newspack-setup-wizard' )
);
