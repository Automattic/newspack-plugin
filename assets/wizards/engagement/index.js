import '../../shared/js/public-path';

/**
 * Engagement
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, postComments } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import {
	CommentingDisqus,
	CommentingNative,
	CommentingCoral,
	Newsletters,
	Social,
	RelatedContent,
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
			relatedPostsEnabled: false,
			relatedPostsMaxAge: 0,
			relatedPostsUpdated: false,
			relatedPostsError: null,
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
			path: '/newspack/v1/wizard/newspack-engagement-wizard',
		} )
			.then( data => this.setState( data ) )
			.catch( error => setError( error ) );
	}

	/**
	 * Update Related Content settings.
	 */
	updatedRelatedContentSettings = async () => {
		const { wizardApiFetch } = this.props;
		const { relatedPostsMaxAge } = this.state;

		try {
			await wizardApiFetch( {
				path: '/newspack/v1/wizard/newspack-engagement-wizard/related-posts-max-age',
				method: 'POST',
				data: { relatedPostsMaxAge },
			} );
			this.setState( { relatedPostsError: null, relatedPostsUpdated: false } );
		} catch ( e ) {
			this.setState( {
				relatedPostsError:
					e.message || __( 'There was an error saving settings. Please try again.', 'newspack' ),
			} );
		}
	};

	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const {
			apiKey,
			connected,
			connectURL,
			wcConnected,
			relatedPostsEnabled,
			relatedPostsError,
			relatedPostsMaxAge,
			relatedPostsUpdated,
		} = this.state;

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
				label: __( 'Recirculation' ),
				path: '/recirculation',
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
		const subheader = __(
			'Newsletters, social, commenting, recirculation, user-generated content'
		);
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/newsletters"
							render={ () => (
								<Newsletters
									noBackground
									headerIcon={ <Icon icon={ postComments } /> }
									headerText={ __( 'Engagement', 'newspack' ) }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
									apiKey={ apiKey }
									connected={ connected }
									connectURL={ connectURL }
									wcConnected={ wcConnected }
									onChange={ _apiKey => this.setState( { apiKey: _apiKey } ) }
								/>
							) }
						/>
						<Route
							path="/social"
							exact
							render={ () => {
								return (
									<Social
										headerIcon={ <Icon icon={ postComments } /> }
										headerText={ __( 'Engagement', 'newspack' ) }
										subHeaderText={ subheader }
										tabbedNavigation={ tabbed_navigation }
									/>
								);
							} }
						/>
						<Route path="/commenting" exact render={ () => <Redirect to="/commenting/disqus" /> } />
						<Route
							path="/commenting/disqus"
							exact
							render={ () => (
								<CommentingDisqus
									headerIcon={ <Icon icon={ postComments } /> }
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
							render={ () => (
								<CommentingNative
									headerIcon={ <Icon icon={ postComments } /> }
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
							render={ () => (
								<CommentingCoral
									headerIcon={ <Icon icon={ postComments } /> }
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
							path="/recirculation"
							exact
							render={ () => (
								<RelatedContent
									headerIcon={ <Icon icon={ postComments } /> }
									headerText={ __( 'Engagement', 'newspack' ) }
									relatedPostsEnabled={ relatedPostsEnabled }
									relatedPostsError={ relatedPostsError }
									subHeaderText={ subheader }
									tabbedNavigation={ tabbed_navigation }
									buttonAction={ () => this.updatedRelatedContentSettings() }
									buttonText={ __( 'Save', 'newspack' ) }
									buttonDisabled={ ! relatedPostsEnabled || ! relatedPostsUpdated }
									relatedPostsMaxAge={ relatedPostsMaxAge }
									onChange={ value => {
										this.setState( { relatedPostsMaxAge: value, relatedPostsUpdated: true } );
									} }
								/>
							) }
						/>
						<Route
							path="/user-generated-content"
							exact
							render={ () => (
								<UGC
									headerIcon={ <Icon icon={ postComments } /> }
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
