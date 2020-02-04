/**
 * Site Design
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Style';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router'
import { ThemeSelection } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class SiteDesignWizard extends Component {

	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			theme: null,
		};
	}

	componentDidMount = () => {
		this.retrieveTheme();
	};

	retrieveTheme = () => {
		const { setError, wizardApiFetch } = this.props;
		const params = { path: '/newspack/v1/wizard/newspack-setup-wizard/theme', method: 'GET' };
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( params )
				.then( response => {
					const { theme } = response;
					this.setState( { theme }, () => resolve( response ) );
				} )
				.catch( error => {
					console.log( '[Theme Fetch Error]', error );
					setError( { error } );
					reject( error );
				} );
		} );
	};

	updateTheme = theme => {
		const { setError, wizardApiFetch } = this.props;
		const params = { path: '/newspack/v1/wizard/newspack-setup-wizard/theme/' + theme, method: 'POST' };
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( params )
				.then( response => {
					const { theme } = response;
					this.setState( { theme }, () => resolve( response ) );
				} )
				.catch( error => {
					console.log( '[Theme Update Error]', error );
					setError( { error } );
					reject( error );
				} );
		} );
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
							render={ routeProps => {
								const { theme } = this.state;
								return (
									<ThemeSelection
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Theme' ) }
										subHeaderText={ __( 'Choose a Newspack theme' ) }
										buttonText={ __( 'Customizer' ) }
										buttonAction='/wp-admin/customize.php?return=%2Fwp-admin%2Fadmin.php%3Fpage%3Dnewspack-site-design-wizard'
										updateTheme={ this.updateTheme }
										theme={ theme }
										isWide
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
