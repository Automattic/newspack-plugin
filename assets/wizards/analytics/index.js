/**
 * Analytics Wizard
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import SearchIcon from '@material-ui/icons/Search';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import { Intro } from './views';

/**
 * External dependencies.
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
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ routeProps => (
								<Intro
									headerIcon={ <SearchIcon /> }
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
