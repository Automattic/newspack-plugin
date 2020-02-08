/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Web';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { ThemeMods, ThemeSelection } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

/**
 * Site Design Wizard.
 */
class SiteDesignWizard extends Component {
	componentDidMount = () => {
		this.retrieveTheme();
	};

	retrieveTheme = () => {
		const { setError, wizardApiFetch } = this.props;
		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
			method: 'GET',
		};
		wizardApiFetch( params )
			.then( response => {
				const { theme, theme_mods: themeMods } = response;
				this.setState( { theme, themeMods } );
			} )
			.catch( error => {
				console.log( '[Theme Fetch Error]', error );
				setError( { error } );
			} );
	};

	updateTheme = theme => {
		const { setError, wizardApiFetch } = this.props;
		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme/' + theme,
			method: 'POST',
		};
		wizardApiFetch( params )
			.then( response => {
				const { theme, theme_mods: themeMods } = response;
				this.setState( { theme, themeMods } );
			} )
			.catch( error => {
				console.log( '[Theme Update Error]', error );
				setError( { error } );
			} );
	};

	setThemeMods = themeModUpdates =>
		this.setState( { themeMods: { ...this.state.themeMods, ...themeModUpdates } } );

	updateThemeMods = () => {
		const { setError, wizardApiFetch } = this.props;
		const { themeMods } = this.state;
		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme-mods/',
			method: 'POST',
			data: { theme_mods: themeMods },
		};
		wizardApiFetch( params )
			.then( response => {
				const { theme, theme_mods: themeMods } = response;
				this.setState( { theme, themeMods } );
			} )
			.catch( error => {
				console.log( '[Theme Update Error]', error );
				setError( { error } );
			} );
	};

	state = {
		theme: null,
	};

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
							render={ () => {
								const { theme } = this.state;
								return (
									<ThemeSelection
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Site Design', 'newspack' ) }
										subHeaderText={ __( 'Choose a Newspack theme', 'newspack' ) }
										buttonText={ __( 'Customize', 'newspack' ) }
										buttonAction="/wp-admin/customize.php"
										updateTheme={ this.updateTheme }
										theme={ theme }
										isWide
									/>
								);
							} }
						/>
						<Route
							path="/theme-mods"
							exact
							render={ routeProps => {
								const { themeMods, theme } = this.state;
								return (
									<ThemeMods
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Site Design', 'newspack' ) }
										subHeaderText={ __( 'Choose a Newspack theme', 'newspack' ) }
										themeMods={ themeMods }
										setThemeMods={ this.setThemeMods }
										buttonText={ __( 'Update Theme', 'newspack' ) }
										buttonAction={ this.updateThemeMods }
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
