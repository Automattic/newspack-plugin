/**
 * Performance Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Wizard for configuring PWA features.
 */
class PerformanceWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		// TK
	};

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => ( <p>TK</p> ) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement( withWizard( PerformanceWizard, [ 'pwa', 'progressive-wp' ] ), {
		buttonText: __( 'Back to dashboard' ),
		buttonAction: newspack_urls[ 'dashboard' ],
	} ),
	document.getElementById( 'newspack-performance-wizard' )
);
