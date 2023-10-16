import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizard, utils } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { ThemeSettings, Main } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

/**
 * Site Design Wizard.
 */
class SiteDesignWizard extends Component {
	componentDidMount = () => {
		const { setError, wizardApiFetch } = this.props;
		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
			method: 'GET',
		};
		wizardApiFetch( params )
			.then( response =>
				this.setState( { themeSettings: { ...response.theme_mods, ...response.etc } } )
			)
			.catch( setError );
	};

	setThemeMods = themeModUpdates =>
		this.setState( { themeSettings: { ...this.state.themeSettings, ...themeModUpdates } } );

	updateThemeSettings = () => {
		const { setError, wizardApiFetch } = this.props;
		const { themeSettings } = this.state;

		// Warn user before overwriting existing posts.
		if (
			( themeSettings.featured_image_all_posts &&
				themeSettings.featured_image_all_posts !== 'none' ) ||
			( themeSettings.post_template_all_posts && themeSettings.post_template_all_posts !== 'none' )
		) {
			if (
				! utils.confirmAction(
					__(
						'Saving will overwrite existing posts, this cannot be undone. Are you sure you want to proceed?',
						'newspack-plugin'
					)
				)
			) {
				return;
			}
		}

		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme/',
			method: 'POST',
			data: { theme_mods: themeSettings },
			quiet: true,
		};
		wizardApiFetch( params )
			.then( response => {
				const { theme, theme_mods } = response;
				this.setState( { theme, themeSettings: theme_mods } );
			} )
			.catch( error => {
				console.log( '[Theme Update Error]', error );
				setError( { error } );
			} );
	};

	state = {};

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements, wizardApiFetch, setError } = this.props;
		const tabbedNavigation = [
			{
				label: __( 'Design' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Settings' ),
				path: '/settings',
				exact: true,
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
							render={ () => {
								return (
									<Main
										headerText={ __( 'Site Design', 'newspack-plugin' ) }
										subHeaderText={ __(
											'Customize the look and feel of your site',
											'newspack-plugin'
										) }
										tabbedNavigation={ tabbedNavigation }
										wizardApiFetch={ wizardApiFetch }
										setError={ setError }
										isPartOfSetup={ false }
									/>
								);
							} }
						/>
						<Route
							path="/settings"
							exact
							render={ () => {
								const { themeSettings } = this.state;
								return (
									<ThemeSettings
										headerText={ __( 'Site Design', 'newspack-plugin' ) }
										subHeaderText={ __( 'Configure your Newspack theme', 'newspack-plugin' ) }
										tabbedNavigation={ tabbedNavigation }
										themeSettings={ themeSettings }
										setThemeMods={ this.setThemeMods }
										buttonText={ __( 'Save', 'newspack-plugin' ) }
										buttonAction={ this.updateThemeSettings }
										secondaryButtonText={ __( 'Advanced Settings', 'newspack-plugin' ) }
										secondaryButtonAction="/wp-admin/customize.php"
									/>
								);
							} }
						/>
						<Redirect to="/" />
					</Switch>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( SiteDesignWizard ) ),
	document.getElementById( 'newspack-site-design-wizard' )
);
