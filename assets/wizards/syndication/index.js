/**
 * Syndication
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/SyncAlt';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import { Intro } from './views';

/**
 * External dependencies.
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

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
							render={ routeProps => (
								<Intro
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Syndication', 'newspack' ) }
									subHeaderText={ 'Apple News, Facebook Instant Articles' }
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
	createElement( withWizard( SyndicationWizard, [ 'fb-instant-articles', 'publish-to-apple-news' ] ) ),
	document.getElementById( 'newspack-syndication-wizard' )
);
