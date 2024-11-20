/**
 * Configuration
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import Main from './settings';
import Campaign from './campaign';
import Complete from './complete';
import { withWizard } from '../../../../components/src';
import Router from '../../../../components/src/proxied-imports/router';

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

export default withWizard( AudienceConfiguration );
