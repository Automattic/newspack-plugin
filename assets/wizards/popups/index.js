import '../../shared/js/public-path';

/**
 * Pop-ups Wizard
 */

/**
 * WordPress dependencies.
 */
import { Component, render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { stringify } from 'qs';
import { groupBy } from 'lodash';

/**
 * Internal dependencies.
 */
import { WebPreview, withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { isOverlay } from './utils';
import {
	CampaignGroupManagement,
	PopupGroup,
	Analytics,
	Settings,
	Segmentation,
	Preview,
} from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

const headerText = __( 'Campaigns', 'newspack' );
const subHeaderText = __( 'Reach your readers with configurable campaigns.', 'newspack' );

const tabbedNavigation = [
	{
		label: __( 'Campaigns', 'newpack' ),
		path: '/campaigns',
		exact: true,
	},
	{
		label: __( 'Segmentation', 'newpack' ),
		path: '/segmentation',
		exact: true,
	},
	{
		label: __( 'Analytics', 'newpack' ),
		path: '/analytics',
		exact: true,
	},
	{
		label: __( 'Settings', 'newpack' ),
		path: '/settings',
		exact: true,
	},
];

class PopupsWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			popups: [],
			segments: [],
			settings: [],
			previewUrl: null,
		};
	}
	onWizardReady = () => {
		this.refetch();
	};

	refetch = () => {
		const { setError, wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-popups-wizard/',
		} )
			.then( ( { groups, popups, segments, settings } ) =>
				this.setState( { groups, popups, segments, settings } )
			)
			.catch( error => setError( error ) );
	};

	/**
	 * Designate which popup should be the sitewide default.
	 *
	 * @param {number} popupId ID of the Popup to become sitewide default.
	 */
	setSitewideDefaultPopup = ( popupId, state ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/sitewide-popup/${ popupId }`,
			method: state ? 'POST' : 'DELETE',
			quiet: true,
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Set terms for a Popup.
	 *
	 * @param {number} id ID of the Popup to alter.
	 * @param {Array} terms Array of terms to assign to the Popup.
	 * @param {string} taxonomy Taxonomy slug.
	 */
	setTermsForPopup = ( id, terms, taxonomy ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/popup-terms/${ id }`,
			method: 'POST',
			data: {
				taxonomy,
				terms,
			},
			quiet: true,
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	updatePopup = ( popupId, options ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/${ popupId }`,
			method: 'POST',
			data: { options },
			quiet: true,
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Delete a popup.
	 *
	 * @param {number} popupId ID of the Popup to alter.
	 */
	deletePopup = popupId => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/${ popupId }`,
			method: 'DELETE',
			quiet: true,
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Publish a popup.
	 *
	 * @param {number} popupId ID of the Popup to alter.
	 */
	publishPopup = popupId => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/${ popupId }/publish`,
			method: 'POST',
			quiet: true,
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Unublish a popup.
	 *
	 * @param {number} popupId ID of the Popup to alter.
	 */
	unpublishPopup = popupId => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/${ popupId }/publish`,
			method: 'DELETE',
			quiet: true,
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	previewUrlForPopup = ( { options, id } ) => {
		const { placement, trigger_type: triggerType } = options;
		const previewURL =
			'inline' === placement || 'scroll' === triggerType
				? window &&
				  window.newspack_popups_wizard_data &&
				  window.newspack_popups_wizard_data.preview_post
				: '/';
		return `${ previewURL }?${ stringify( { ...options, newspack_popups_preview_id: id } ) }`;
	};

	manageCampaignGroup = ( campaigns, method = 'POST' ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-popups-wizard/batch-publish/',
			data: { ids: campaigns.map( campaign => campaign.id ) },
			method,
		} )
			.then( () => this.onWizardReady() )
			.catch( error => setError( error ) );
	};

	renameCampaignGroup = ( id, name ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/rename-campaign/${ id }`,
			method: 'POST',
			data: { name },
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	archiveCampaignGroup = ( id, status ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/archive-campaign/${ id }`,
			method: status ? 'POST' : 'DELETE',
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	duplicateCampaignGroup = ( id, name ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/duplicate-campaign/${ id }`,
			method: 'POST',
			data: { name },
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	deleteCampaignGroup = id => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/delete-campaign/${ id }`,
			method: 'DELETE',
		} )
			.then( ( { groups, popups } ) => this.setState( { groups, popups } ) )
			.catch( error => setError( error ) );
	};

	render() {
		const {
			pluginRequirements,
			setError,
			isLoading,
			wizardApiFetch,
			startLoading,
			doneLoading,
		} = this.props;
		const { groups, popups, segments, settings, previewUrl } = this.state;
		return (
			<WebPreview
				url={ previewUrl }
				renderButton={ ( { showPreview } ) => {
					const sharedProps = {
						headerText,
						subHeaderText,
						tabbedNavigation,
						setError,
						isLoading,
						startLoading,
						doneLoading,
						wizardApiFetch,
						segments,
						settings,
					};
					const popupManagementSharedProps = {
						...sharedProps,
						manageCampaignGroup: this.manageCampaignGroup,
						setSitewideDefaultPopup: this.setSitewideDefaultPopup,
						setTermsForPopup: this.setTermsForPopup,
						updatePopup: this.updatePopup,
						deletePopup: this.deletePopup,
						previewPopup: popup =>
							this.setState( { previewUrl: this.previewUrlForPopup( popup ) }, () =>
								showPreview()
							),
						publishPopup: this.publishPopup,
						unpublishPopup: this.unpublishPopup,
						refetch: this.refetch,
						archiveCampaignGroup: this.archiveCampaignGroup,
						deleteCampaignGroup: this.deleteCampaignGroup,
						duplicateCampaignGroup: this.duplicateCampaignGroup,
						renameCampaignGroup: this.renameCampaignGroup,
					};
					return (
						<HashRouter hashType="slash">
							<Switch>
								{ pluginRequirements }
								<Route
									path="/campaigns/:group?"
									render={ () => (
										<PopupGroup
											{ ...popupManagementSharedProps }
											items={ popups }
											groups={ groups }
											emptyMessage={ __( 'No Campaigns have been created yet.', 'newspack' ) }
											groupUI={ true }
										/>
									) }
								/>
								<Route
									path="/segmentation/:id?"
									render={ props => (
										<Segmentation
											{ ...props }
											{ ...sharedProps }
											setSegments={ segmentsList => this.setState( { segments: segmentsList } ) }
										/>
									) }
								/>
								<Route path="/analytics" render={ () => <Analytics { ...sharedProps } /> } />
								<Route path="/settings" render={ () => <Settings { ...sharedProps } /> } />
								<Redirect to="/campaigns" />
							</Switch>
						</HashRouter>
					);
				} }
			/>
		);
	}
}

render(
	createElement( withWizard( PopupsWizard, [ 'jetpack', 'newspack-popups' ] ) ),
	document.getElementById( 'newspack-popups-wizard' )
);
