/**
 * Health Check Wizard
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { ExternalLink, SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';
import { RemoveUnsupportedPlugins } from './views';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * SEO wizard.
 */
class HealthCheckWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			healthCheckData: {
				unsupportedPlugins: [],
			},
		};
	}
	onWizardReady = () => {
		this.fetchHealthData();
	};

	fetchHealthData = () => {
		const { wizardApiFetch, setError } = this.props;
		wizardApiFetch( { path: '/newspack/v1/wizard/newspack-health-check-wizard/' } )
			.then( healthCheckData => this.setState( { healthCheckData } ) )
			.catch( error => {
				setError( error );
			} );
	};

	deactivateAllPlugins = () => {
		const { wizardApiFetch, setError } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-health-check-wizard/unsupported_plugins',
			method: 'delete',
		} )
			.then( healthCheckData => this.setState( { healthCheckData } ) )
			.catch( error => {
				setError( error );
			} );
	};
	/**
	 * Render
	 */
	render() {
		const { healthCheckData } = this.state;
		const { unsupported_plugins: unsupportedPlugins } = healthCheckData;
		const headerIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M15.9 5c-.17 0-.32.09-.41.23l-.07.15-5.18 11.65c-.16.29-.26.61-.26.96 0 1.11.9 2.01 2.01 2.01.96 0 1.77-.68 1.96-1.59l.01-.03L16.4 5.5c0-.28-.22-.5-.5-.5zM1 9l2 2c2.88-2.88 6.79-4.08 10.53-3.62l1.19-2.68C9.89 3.84 4.74 5.27 1 9zm20 2l2-2c-1.64-1.64-3.55-2.82-5.59-3.57l-.53 2.82c1.5.62 2.9 1.53 4.12 2.75zm-4 4l2-2c-.8-.8-1.7-1.42-2.66-1.89l-.55 2.92c.42.27.83.59 1.21.97zM5 13l2 2c1.13-1.13 2.56-1.79 4.03-2l1.28-2.88c-2.63-.08-5.3.87-7.31 2.88z" />
			</SVG>
		);
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						<Route
							path="/"
							exact
							render={ routeProps => (
								<RemoveUnsupportedPlugins
									headerIcon={ headerIcon }
									headerText={ __( 'Health Check', 'newspack' ) }
									subHeaderText={ __( 'Verify and correct site health issues', 'newspack' ) }
									noBackground
									deactivateAllPlugins={ this.deactivateAllPlugins }
									unsupportedPlugins={
										unsupportedPlugins &&
										Object.keys( unsupportedPlugins ).map( value => ( {
											...unsupportedPlugins[ value ],
											Slug: value,
										} ) )
									}
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
	createElement( withWizard( HealthCheckWizard ) ),
	document.getElementById( 'newspack-health-check-wizard' )
);
