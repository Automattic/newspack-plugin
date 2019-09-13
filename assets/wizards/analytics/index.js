/**
 * Analytics Wizard
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard, WizardPagination } from '../../components/src';
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
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<WizardPagination />
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ routeProps => (
								<Intro
									noBackground
									headerText={ __( 'Analytics', 'newspack' ) }
									subHeaderText={ __( 'Track traffic and activity' ) }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
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
