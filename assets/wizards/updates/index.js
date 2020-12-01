import '../../shared/js/public-path';

/**
 * Updates
 */

/**
 * WordPress dependencies.
 */
import { Component, render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, reusableBlock } from '@wordpress/icons';

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
								headerIcon={ <Icon icon={ reusableBlock } /> }
								headerText={ __( 'Updates', 'newspack' ) }
								subHeaderText={ __( 'Updates to the Newspack plugins and theme.', 'newspack' ) }
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
