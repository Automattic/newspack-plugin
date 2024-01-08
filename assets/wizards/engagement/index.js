import '../../shared/js/public-path';

/**
 * Engagement
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import {
	ReaderActivation,
	ReaderActivationCampaign,
	ReaderActivationComplete,
	Newsletters,
	Social,
	RelatedContent,
} from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class EngagementWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
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
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/related-content',
		} )
			.then( data => this.setState( data ) )
			.catch( error => setError( error ) );
	};

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
		const { pluginRequirements, wizardApiFetch } = this.props;
		const { relatedPostsEnabled, relatedPostsError, relatedPostsMaxAge, relatedPostsUpdated } =
			this.state;

		const defaultPath = '/reader-activation';
		const tabbed_navigation = [
			{
				label: __( 'Reader Activation', 'newspack' ),
				path: '/reader-activation',
				exact: true,
				activeTabPaths: [
					'/reader-activation',
					'/reader-activation/campaign',
					'/reader-activation/complete',
				],
			},
			{
				label: __( 'Newsletters', 'newspack' ),
				path: '/newsletters',
				exact: true,
			},
			{
				label: __( 'Social', 'newspack' ),
				path: '/social',
				exact: true,
			},
			{
				label: __( 'Recirculation', 'newspack' ),
				path: '/recirculation',
			},
		];
		const props = {
			headerText: __( 'Engagement', 'newspack' ),
			tabbedNavigation: tabbed_navigation,
			wizardApiFetch,
		};
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/reader-activation"
							exact
							render={ () => (
								<ReaderActivation
									subHeaderText={ __( 'Configure your reader activation settings', 'newspack' ) }
									{ ...props }
								/>
							) }
						/>
						<Route
							path="/reader-activation/campaign"
							render={ () => (
								<ReaderActivationCampaign
									subHeaderText={ __(
										'Preview and customize the reader activation prompts',
										'newspack'
									) }
									{ ...props }
								/>
							) }
						/>
						<Route
							path="/reader-activation/complete"
							render={ () => (
								<ReaderActivationComplete
									subHeaderText={ __(
										'Preview and customize the reader activation prompts',
										'newspack'
									) }
									{ ...props }
								/>
							) }
						/>
						<Route
							path="/newsletters"
							render={ () => (
								<Newsletters
									subHeaderText={ __( 'Configure your newsletter settings', 'newspack' ) }
									{ ...props }
								/>
							) }
						/>
						<Route
							path="/social"
							exact
							render={ () => (
								<Social
									subHeaderText={ __( 'Share your content to social media', 'newspack' ) }
									{ ...props }
								/>
							) }
						/>
						<Route
							path="/recirculation"
							exact
							render={ () => (
								<RelatedContent
									{ ...props }
									subHeaderText={ __( 'Engage visitors with related content', 'newspack' ) }
									relatedPostsEnabled={ relatedPostsEnabled }
									relatedPostsError={ relatedPostsError }
									buttonAction={ () => this.updatedRelatedContentSettings() }
									buttonText={ __( 'Save Settings', 'newspack' ) }
									buttonDisabled={ ! relatedPostsEnabled || ! relatedPostsUpdated }
									relatedPostsMaxAge={ relatedPostsMaxAge }
									onChange={ value => {
										this.setState( { relatedPostsMaxAge: value, relatedPostsUpdated: true } );
									} }
								/>
							) }
						/>
						<Redirect to={ defaultPath } />
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
