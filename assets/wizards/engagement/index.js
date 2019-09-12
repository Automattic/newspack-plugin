/**
 * Engagement Wizard
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';
import { Intro, MailchimpConnect, SubscriptionBlock } from './views';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Engagement wizard.
 */
class EngagementWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			apiKey: '',
			connected: false,
			connectURL: '',
		};
	}

	/**
	 * Figure out whether to use the WooCommerce or Jetpack Mailchimp wizards and get appropriate settings.
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
			path: '/newspack/v1/wizard/newspack-engagement-wizard/connection-status',
		} )
			.then( info => {
				this.setState( {
					...info,
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { apiKey, connected, connectURL } = this.state;
		const tabbed_navigation = [
			{
				label: __( 'Welcome' ),
				path: '/',
				exact: true,
			},
			{
				label: __( 'Mailchimp' ),
				path: '/mailchimp-connect',
				exact: true,
			},
			{
				label: __( 'Mailchimp block Block' ),
				path: '/subscription-block',
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
							render={ routeProps => (
								<Intro
									noBackground
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ __( 'Newsletters, social, commenting, UGC' ) }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbed_navigation }
								/>
							) }
						/>
						<Route
							path="/mailchimp-connect"
							exact
							render={ routeProps => {
								const { apiKey } = this.state;
								return (
									<MailchimpConnect
										noBackground
										headerText={ __( 'Engagement', 'newspack' ) }
										subHeaderText={ __( 'Newsletters, social, commenting, UGC' ) }
										secondaryButtonText={ __( 'Back to dashboard' ) }
										secondaryButtonAction={ window && window.newspack_urls.dashboard }
										secondaryButtonStyle={ { isDefault: true } }
										tabbedNavigation={ tabbed_navigation }
										onChange={ apiKey => this.setState( { apiKey } ) }
										apiKey={ apiKey }
									/>
								);
							} }
						/>
						<Route
							path="/subscription-block"
							exact
							render={ routeProps => (
								<SubscriptionBlock
									noBackground
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ __( 'Newsletters, social, commenting, UGC' ) }
									secondaryButtonText={ __( 'Back to dashboard' ) }
									secondaryButtonAction={ window && window.newspack_urls.dashboard }
									secondaryButtonStyle={ { isDefault: true } }
									tabbedNavigation={ tabbed_navigation }
									connected={ connected }
									connectURL={ connectURL }
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
	createElement( withWizard( EngagementWizard, [ 'jetpack' ] ) ),
	document.getElementById( 'newspack-engagement-wizard' )
);
