import '../../shared/js/public-path';

/**
 * Syndication
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
import { Intro } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class SyndicationWizard extends Component {
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
							render={ () => (
								<Intro
									headerText={ __( 'Syndication', 'newspack' ) }
									subHeaderText={ __(
										'Distribute your content across multiple websites',
										'newspack'
									) }
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
	createElement( withWizard( SyndicationWizard ) ),
	document.getElementById( 'newspack-syndication-wizard' )
);
