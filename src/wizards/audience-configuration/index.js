import '../../shared/js/public-path';

/**
 * Engagement
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
import { Main, Campaign, Complete } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class AudienceConfiguration extends Component {
	/**
	 * Render
	 */
	render() {
		const { pluginRequirements, wizardApiFetch } = this.props;

		const props = {
			headerText: __(
				'Audience Development / Configuration',
				'newspack-plugin'
			),
			tabbedNavigation: [],
			wizardApiFetch,
		};
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ () => <Main { ...props } /> }
						/>
						<Route
							path="/campaign"
							render={ () => (
								<Campaign
									{ ...props }
									headerText={ __(
										'Audience Development / Campaigns',
										'newspack-plugin'
									) }
								/>
							) }
						/>
						<Route
							path="/complete"
							render={ () => <Complete { ...props } /> }
						/>
						<Redirect to="/" />
					</Switch>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( AudienceConfiguration, [ 'jetpack' ] ) ),
	document.getElementById( 'audience-configuration' )
);
