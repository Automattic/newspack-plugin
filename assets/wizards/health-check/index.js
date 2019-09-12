/**
 * Health Check Wizard
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
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

	removeAllPlugins = () => {
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
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						<Route
							path="/"
							exact
							render={ routeProps => (
								<RemoveUnsupportedPlugins
									headerText={ __( 'Health Check', 'newspack' ) }
									subHeaderText={ __( 'Verify and correct site health issues', 'newspack' ) }
									removeAllPlugins={ this.removeAllPlugins }
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
