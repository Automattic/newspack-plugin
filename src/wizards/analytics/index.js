import '../../shared/js/public-path';

/**
 * Analytics
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
import { Plugins, NewspackCustomEvents } from './views';
import './style.scss';

const { HashRouter, Redirect, Route, Switch } = Router;

const TABS = [
	{
		label: __( 'Plugins', 'newspack-plugin' ),
		path: '/',
		exact: true,
	},
	{
		label: __( 'Newspack Custom Events', 'newspack-plugin' ),
		path: '/newspack-custom-events',
	},
];

class AnalyticsWizard extends Component {
	/**
	 * Render
	 */
	render() {
		const { pluginRequirements, wizardApiFetch, isLoading } = this.props;
		const sharedProps = {
			headerText: __( 'Analytics', 'newspack-plugin' ),
			subHeaderText: __( 'Manage Google Analytics Configuration', 'newspack-plugin' ),
			tabbedNavigation: TABS,
			wizardApiFetch,
			isLoading,
		};
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/newspack-custom-events"
							exact
							render={ () => <NewspackCustomEvents { ...sharedProps } /> }
						/>
						<Route path="/" exact render={ () => <Plugins { ...sharedProps } /> } />
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
