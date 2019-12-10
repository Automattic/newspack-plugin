/**
 * Analytics Wizard
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { ExternalLink, SVG, Path } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';
import { Intro } from './views';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Analytics wizard.
 */
class AnalyticsWizard extends Component {

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const headerIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
			</SVG>
		);
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ routeProps => (
								<Intro
									headerIcon={ headerIcon }
									headerText={ __( 'Analytics', 'newspack' ) }
									subHeaderText={ __( 'Track traffic and activity') }
									buttonText={ __( 'Back to dashboard' ) }
									buttonAction={ window && window.newspack_urls.dashboard }
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
	createElement( withWizard( AnalyticsWizard, [ 'google-site-kit' ] ) ),
	document.getElementById( 'newspack-analytics-wizard' )
);
