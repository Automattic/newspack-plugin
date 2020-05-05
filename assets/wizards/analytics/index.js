import '../../shared/js/public-path';

/**
 * Analytics
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/TrendingUp';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Intro, Events } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class AnalyticsWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			eventsEnabled: false,
			eventCategories: [],
		};
	}

	/**
	 * Get saved info once ready.
	 */
	onWizardReady = () => {
		this.getSettings();
	};

	/**
	 * Get settings for the current wizard.
	 */
	getSettings() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-analytics-wizard',
		} )
			.then( data => this.setState( data ) )
			.catch( error => setError( error ) );
	}

	/**
	 * Update data model
	 */
	update = ( data ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-analytics-wizard/',
			method: 'POST',
			data: data,
		} )
			.then( _data => {
				return new Promise( resolve => {
					this.setState(
						{
							..._data,
						},
						() => {
							setError();
							resolve( this.state );
						}
					);
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	};

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { eventsEnabled, eventCategories } = this.state;

		const tabbed_navigation = [
			{
				label: __( 'Analytics' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Events' ),
				path: '/events',
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
							render={ () => (
								<Intro
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Analytics', 'newspack' ) }
									subHeaderText={ __( 'Track traffic and activity' ) }
									tabbedNavigation={ tabbed_navigation }
								/>
							) }
						/>
						<Route
							path="/events"
							exact
							render={ () => {
								return (
									<Events
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Analytics', 'newspack' ) }
										subHeaderText={ __( 'Track traffic and activity' ) }
										tabbedNavigation={ tabbed_navigation }
										eventsEnabled={ eventsEnabled }
										eventCategories={ eventCategories }
										onChange={ this.update }
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
	createElement( withWizard( AnalyticsWizard, [ 'google-site-kit' ] ) ),
	document.getElementById( 'newspack-analytics-wizard' )
);
