import '../../shared/js/public-path';

/**
 * Updates
 */

/**
 * WordPress dependencies.
 */
import { Component, render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Widgets';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { DevInfo } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class UpdatesWizard extends Component {
	/**
	 * Render
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
						render={ () => (
							<DevInfo
								headerIcon={ <HeaderIcon /> }
								headerText={ __( "What's new?", 'newspack' ) }
								subHeaderText={ __( 'Updates to the Newspack plugins and theme.' ) }
							/>
						) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement( withWizard( UpdatesWizard, [] ) ),
	document.getElementById( 'newspack-updates-wizard' )
);
