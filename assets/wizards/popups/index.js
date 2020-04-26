import '../../shared/js/public-path';

/**
 * Pop-ups Wizard
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/NewReleases';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Overlay, Inline, Analytics } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

const headerText = __( 'Pop-ups', 'newspack' );
const subHeaderText = __( 'Reach your readers with configurable calls-to-action.', 'newspack' );

const tabbedNavigation = [
	{
		label: __( 'Overlay', 'newpack' ),
		path: '/overlay',
		exact: true,
	},
	{
		label: __( 'Inline', 'newpack' ),
		path: '/inline',
		exact: true,
	},
	{
		label: __( 'Analytics', 'newpack' ),
		path: '/analytics',
		exact: true,
	},
];

const PopupsWizard = ( { pluginRequirements } ) => {
	return (
		<Fragment>
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/overlay"
						render={ () => (
							<Overlay
								headerIcon={ <HeaderIcon /> }
								headerText={ headerText }
								subHeaderText={ subHeaderText }
								tabbedNavigation={ tabbedNavigation }
							/>
						) }
					/>
					<Route
						path="/inline"
						render={ () => (
							<Inline
								headerIcon={ <HeaderIcon /> }
								headerText={ headerText }
								subHeaderText={ subHeaderText }
								tabbedNavigation={ tabbedNavigation }
							/>
						) }
					/>
					<Route
						path="/analytics"
						render={ () => (
							<Analytics
								headerIcon={ <HeaderIcon /> }
								headerText={ headerText }
								subHeaderText={ subHeaderText }
								tabbedNavigation={ tabbedNavigation }
							/>
						) }
					/>
					<Redirect to="/overlay" />
				</Switch>
			</HashRouter>
		</Fragment>
	);
};

render(
	createElement( withWizard( PopupsWizard, [ 'jetpack', 'newspack-popups' ] ) ),
	document.getElementById( 'newspack-popups-wizard' )
);
