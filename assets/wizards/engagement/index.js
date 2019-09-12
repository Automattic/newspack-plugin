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
import { Commenting, CommentingDisqus, CommentingNative, CommentingCoral, Newsletters, Social, UGC } from './views';

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
				label: __( 'Newsletters' ),
				path: '/newsletters',
				exact: true,
			},
			{
				label: __( 'Social' ),
				path: '/social',
				exact: true,
			},
			{
				label: __( 'Commenting' ),
				path: '/commenting/disqus',
			},
			{
				label: __( 'UGC' ),
				path: '/user-generated-content',
			},
		];
		const commentingSecondaryNavigation = [
			{
				label: __( 'Disqus' ),
				path: '/commenting/disqus',
				exact: true,
			},
			{
				label: __( 'Native' ),
				path: '/commenting/native',
				exact: true,
			},
			{
				label: __( 'Coral' ),
				path: '/commenting/coral',
				exact: true,
			},
		];
		const subheader = __( 'Newsletters, social, commenting, UGC' );
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/newsletters"
							render={ routeProps => (
								<Newsletters
									noBackground
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
									apiKey={ apiKey }
									connected={ connected }
									connectURL={ connectURL }
								/>
							) }
						/>
						<Route
							path="/social"
							exact
							render={ routeProps => {
								const { apiKey } = this.state;
								return (
									<Social
										noBackground
										headerText={ __( 'Engagement', 'newspack' ) }
										subHeaderText={ subheader }
										tabbedNavigation={ tabbed_navigation }
										onChange={ apiKey => this.setState( { apiKey } ) }
									/>
								);
							} }
						/>
						<Route
							path="/commenting/disqus"
							exact
							render={ routeProps => (
								<CommentingDisqus
									noBackground
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
									connected={ connected }
									connectURL={ connectURL }
									secondaryNavigation={ commentingSecondaryNavigation }
								/>
							) }
						/>
						<Route
							path="/commenting/native"
							exact
							render={ routeProps => (
								<CommentingNative
									noBackground
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
									connected={ connected }
									connectURL={ connectURL }
									secondaryNavigation={ commentingSecondaryNavigation }
								/>
							) }
						/>
						<Route
							path="/commenting/coral"
							exact
							render={ routeProps => (
								<CommentingCoral
									noBackground
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
									connected={ connected }
									connectURL={ connectURL }
									secondaryNavigation={ commentingSecondaryNavigation }
								/>
							) }
						/>
						<Route
							path="/user-generated-content"
							exact
							render={ routeProps => (
								<UGC
									noBackground
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
								/>
							) }
						/>
						<Redirect to="/newsletters" />
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
