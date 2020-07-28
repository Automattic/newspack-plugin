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
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/TrendingUp';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Plugins, Configuration } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

const TABS = [
	{
		label: __( 'Configuration', 'newspack' ),
		path: '/',
		exact: true,
	},
	{
		label: __( 'Plugins', 'newspack' ),
		path: '/plugins',
	},
];

class AnalyticsWizard extends Component {
	/**
	 * Render
	 */
	render() {
		const { pluginRequirements, wizardApiFetch } = this.props;
		const sharedProps = {
			headerIcon: <HeaderIcon />,
			headerText: __( 'Analytics', 'newspack' ),
			subHeaderText: __( 'Track traffic and activity', 'newspack' ),
			tabbedNavigation: TABS,
			wizardApiFetch,
		};
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route path="/plugins" exact render={ () => <Plugins { ...sharedProps } /> } />
						<Route path="/" exact render={ () => <Configuration { ...sharedProps } /> } />
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
