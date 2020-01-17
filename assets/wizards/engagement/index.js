/**
 * Engagement
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
import HeaderIcon from '@material-ui/icons/Forum';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/proxied-imports/router'
import {
	Commenting,
	CommentingDisqus,
	CommentingNative,
	CommentingCoral,
	Newsletters,
	Social,
	UGC,
} from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class EngagementWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			apiKey: '',
			connected: false,
			connectURL: '',
			wcConnected: false,
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
		const { apiKey, connected, connectURL, wcConnected } = this.state;
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
				path: '/commenting/',
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
				label: __( 'WordPress Discussion' ),
				path: '/commenting/native',
				exact: true,
			},
			{
				label: __( 'The Coral Project' ),
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
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
									apiKey={ apiKey }
									connected={ connected }
									connectURL={ connectURL }
									wcConnected={ wcConnected }
									onChange={ apiKey => this.setState( { apiKey } ) }
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
										headerIcon={ <HeaderIcon /> }
										headerText={ __( 'Engagement', 'newspack' ) }
										subHeaderText={ subheader }
										tabbedNavigation={ tabbed_navigation }
									/>
								);
							} }
						/>
						<Route
							path="/commenting"
							exact
							render={ routeProps => <Redirect to="/commenting/disqus" /> }
						/>
						<Route
							path="/commenting/disqus"
							exact
							render={ routeProps => (
								<CommentingDisqus
									headerIcon={ <HeaderIcon /> }
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
									headerIcon={ <HeaderIcon /> }
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
									headerIcon={ <HeaderIcon /> }
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
									headerIcon={ <HeaderIcon /> }
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
