/**
 * "Components Demo" Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';


/**
 * Internal dependencies
 */
import {
	FormattedHeader,
	Card,
	SelectControl,
	Button,
	ActionCard,
} from '../../components';
import './style.scss';

/**
 * Components demo for example purposes.
 */
class AdvertisingWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );

		// TODO: Query WP via API to grab the current state of options and flll
		// state from the DB. E.g. which network, which placements?
		this.state = {
			adNetwork: false,
			frontPage: false,
			posts: false,
			pages: false,
			archives: false,
			topOfPage: false,
			secondBelowPost: false,
		};
	}

	/**
	 * Take the chosen ad placement settings and save them according to the
	 * chosen ad network provider.
	 */
	savePlacementSettings() {
		const { adNetwork } = this.props;

		if ( adNetwork == 'wordsads' ) {
			this.savePlacementSettingsForWordAds();
		} else if ( adNetwork == 'gadmanager' ) {
			this.savePlacementSettingsForGAdManager();
		} else {
			// TODO: Something is wrong, deal with it.
		}
	}

	/**
	 * Save the placement settings for WordAds.
	 */
	savePlacementSettingsForWordAds() {
		const {
			frontPage,
			posts,
			pages,
			archives,
			topOfPage,
			secondBelowPost,
		} = this.props;

		// Make TODO: Make an API request to update the Jetpack option.

		// Done, show a "saved" message.

	}

	/**
	 * Save the placement settings for Google Ad Manager.
	 */
	savePlacementSettingsForGAdManager() {
		const {
			frontPage,
			posts,
			pages,
			archives,
			topOfPage,
			secondBelowPost,
		} = this.props;

		// TODO: Make an API request to update the Newspack option.

		// Done, show a "saved" message.

	}

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			adNetwork,
			frontPage,
			posts,
			pages,
			archives,
			topOfPage,
			secondBelowPost,
		} = this.state;

		if ( ! adNetwork ) {
			return (
				<Fragment>
					<FormattedHeader
						headerText={ __( 'Which Ad Service would you like to use?' ) }
						subHeaderText={ __( 'Enhance your Newspack site with advertising. Choose from any combination of the products below.' ) }
					/>
					<Card>
	 					<div className="newspack-card-header">
	 						<h1>{ __( 'Ad Provider' ) }</h1>
	 						<h2>{ __( 'Choose your preferred ad provider' ) }</h2>
	 					</div>
	 					<SelectControl
	 						label="Select Ad Provider"
	 						value={ adNetwork }
	 						options={ [
	 							{ value: null, label: 'Select Ad Provider' },
	 							{ value: 'wordads', label: 'WordAds from WordPress.com' },
	 							{ value: 'gadsense', label: 'Google AdSense' },
	 							{ value: 'gadmanager', label: 'Google Ad Manager' },
	 						] }
	 						onChange={ value => this.setState( { adNetwork: value } ) }
	 					/>
	 				</Card>
				</Fragment>
			);
		} else if ( adNetwork != 'gadsense' ) {
			return (
				<Fragment>
					<FormattedHeader
						headerText={ __( 'Advert Placement' ) }
						subHeaderText={ __( 'Choose from several pre-defined ad spots in which to place your ad inventory.' ) }
					/>
					{ ( adNetwork == 'wordads' ) && (
						<Card>
							<small className="jp-form-setting-explanation">
								{ __(
									'By activating ads, you agree to the Automattic Ads {{link}}Terms of Service{{/link}}.',
									{
										components: {
											link: (
												<a
													href="https://wordpress.com/automattic-ads-tos/"
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										},
									}
								) }
							</small>
						</Card>
					) }
					<Card>
						<div className="newspack-card-header">
							<h1>{ __( 'Ad Placements' ) }</h1>
							<h2>{ __( 'Display ads below posts on' ) }</h2>
						</div>
						<ToggleControl
							label="Front Page"
							checked={ frontPage }
							onChange={ () => this.setState( { frontPage: ! frontPage } ) }
						/>
						<ToggleControl
							label="Posts"
							checked={ posts }
							onChange={ () => this.setState( { posts: ! posts } ) }
						/>
						<ToggleControl
							label="Pages"
							checked={ pages }
							onChange={ () => this.setState( { pages: ! pages } ) }
						/>
						<ToggleControl
							label="Archives"
							checked={ archives }
							onChange={ () => this.setState( { archives: ! archives } ) }
						/>
					</Card>
					<Card>
						<div className="newspack-card-header">
							<h1>{ __( 'Additional Ad Placements' ) }</h1>
						</div>
						<ToggleControl
							label="Top of each page"
							checked={ topOfPage }
							onChange={ () => this.setState( { topOfPage: ! topOfPage } ) }
						/>
						<ToggleControl
							label="Second ad below post"
							checked={ secondBelowPost }
							onChange={ () => this.setState( { secondBelowPost: ! secondBelowPost } ) }
						/>
					</Card>
					<Card>
						<Button
							isPrimary
							className="is-centered"
							onClick={ () => savePlacementSettings() }
						>{  __( 'Save' ) }</Button>
						<Button
							isTertiary
							className="is-centered"
							onClick={ () => this.setState( { adNetwork: false } ) }
						>{  __( 'Change Ad Provider' ) }</Button>
					</Card>
				</Fragment>
			);
		} else if ( adNetwork == 'gadsense' ) {
			return (
				<Fragment>
					<FormattedHeader
						headerText={ __( 'Which Ad Service would you like to use?' ) }
						subHeaderText={ __( 'Enhance your Newspack site with advertising. Choose from any combination of the products below.' ) }
					/>
					<ActionCard
						title="Google AdSense"
						description="AdSense is configured via Google SiteKit."
						actionText="Activate"
					/>
					<Button
						isTertiary
						className="is-centered"
						onClick={ () => this.setState( { adNetwork: false } ) }
					>{  __( 'Change Ad Provider' ) }</Button>
				</Fragment>
			);
		}
	}
}

render( <AdvertisingWizard />, document.getElementById( 'newspack-advertising-wizard' ) );
