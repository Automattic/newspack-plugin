/**
 * SEO
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Search';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Environment, Separator, Social, Tools } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class SEOWizard extends Component {
	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const tabbedNavigation = [
			{
				label: __( 'Environment', 'newspack' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'separator', 'newspack' ),
				path: '/separator',
				exact: true,
			},
			{
				label: __( 'Tools', 'newspack' ),
				path: '/tools',
				exact: true,
			},
			{
				label: __( 'Social', 'newspack' ),
				path: '/social',
			},
		];
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/"
							exact
							render={ () => (
								<Environment
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'SEO' ) }
									subHeaderText={ __( 'Search engine and social optimization' ) }
									tabbedNavigation={ tabbedNavigation }
								/>
							) }
						/>
						<Route
							path="/separator"
							exact
							render={ () => (
								<Separator
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'SEO' ) }
									subHeaderText={ __( 'Search engine and social optimization' ) }
									tabbedNavigation={ tabbedNavigation }
								/>
							) }
						/>
						<Route
							path="/social"
							exact
							render={ () => (
								<Social
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'SEO' ) }
									subHeaderText={ __( 'Search engine and social optimization' ) }
									tabbedNavigation={ tabbedNavigation }
								/>
							) }
						/>
						<Route
							path="/tools"
							exact
							render={ () => (
								<Tools
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'SEO' ) }
									subHeaderText={ __( 'Search engine and social optimization' ) }
									tabbedNavigation={ tabbedNavigation }
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
	createElement( withWizard( SEOWizard, [ 'wordpress-seo', 'jetpack' ] ) ),
	document.getElementById( 'newspack-seo-wizard' )
);
