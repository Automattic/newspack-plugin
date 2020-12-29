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
import { groupBy, mapValues } from 'lodash';

/**
 * Internal dependencies.
 */
import { WebPreview, withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { isOverlay } from './utils';
import { PopupGroup, Analytics, Settings, Segmentation, Preview } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

const headerText = __( 'Campaigns and Segmention', 'newspack' );
const subHeaderText = __( 'Reach your readers with configurable campaigns.', 'newspack' );

const tabbedNavigation = [
	{
		label: __( 'Campaigns', 'newpack' ),
		path: '/campaigns',
		exact: true,
	},
	{
		label: __( 'Segments', 'newpack' ),
		path: '/segmentation',
		exact: true,
	},
	{
		label: __( 'Analytics', 'newpack' ),
		path: '/analytics',
		exact: true,
	},
	{
		label: __( 'Preview', 'newpack' ),
		path: '/preview',
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
			groups: [],
			popups: {
				all: {},
			},
			segments: [],
			previewUrl: null,
		};
	}
	onWizardReady = () => {
		const { setError, wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-popups-wizard/',
		} )
			.then( ( { current_group: currentGroup, groups, popups, segments } ) =>
				this.setState( {
					currentGroup: currentGroup ? currentGroup : -1,
					groups,
					popups: this.sortPopups( popups ),
					segments,
				} )
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
		} )
			.then( ( { popups } ) => this.setState( { popups: this.sortPopups( popups ) } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Set current campaign group.
	 *
	 * @param {number} Term ID of group to select.
	 */
	setCurrentGroup = currentGroup => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/current-group/${ currentGroup }`,
			method: 'POST',
		} )
			.then( ( { current_group } ) => this.setState( { currentGroup: current_group } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Unset current campaign group.
	 */
	unsetCurrentGroup = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/current-group`,
			method: 'DELETE',
		} )
			.then( ( { current_group } ) => this.setState( { currentGroup: current_group } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Set taxonomy terms for a Popup.
	 *
	 * @param {number} popupId ID of the Popup to alter.
	 * @param {Array} categories Array of categories to assign to the Popup.
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
		} )
			.then( ( { popups } ) => this.setState( { popups: this.sortPopups( popups ) } ) )
			.catch( error => setError( error ) );
	};

	updatePopup = ( popupId, options ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/${ popupId }`,
			method: 'POST',
			data: { options },
		} )
			.then( ( { popups } ) => this.setState( { popups: this.sortPopups( popups ) } ) )
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
		} )
			.then( ( { popups } ) => this.setState( { popups: this.sortPopups( popups ) } ) )
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
		} )
			.then( ( { popups } ) => this.setState( { popups: this.sortPopups( popups ) } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Sort Pop-ups into categories.
	 */
	sortPopups = popups => ( {
		all: {},
		...mapValues( groupBy( popups, popup => 'all' ), this.sortPopupGroup ),
	} );

	/**
	 * Sort Pop-up groups into categories.
	 */
	sortPopupGroup = popups => {
		const test = popups.filter(
			( { options, status } ) => 'publish' === status && 'test' === options.frequency
		);
		const draft = popups.filter( ( { status } ) => 'draft' === status );
		const active = popups.filter(
			( { categories, options, sitewide_default: sitewideDefault, status } ) =>
				isOverlay( { options } )
					? 'test' !== options.frequency &&
					  ( sitewideDefault || categories.length ) &&
					  'publish' === status
					: 'test' !== options.frequency && 'never' !== options.frequency && 'publish' === status
		);
		const activeWithSitewideDefaultFirst = [
			...active.filter( ( { sitewide_default: sitewideDefault } ) => sitewideDefault ),
			...active.filter( ( { sitewide_default: sitewideDefault } ) => ! sitewideDefault ),
		];
		const inactive = popups.filter(
			( { categories, options, sitewide_default: sitewideDefault, status } ) =>
				isOverlay( { options } )
					? 'test' !== options.frequency &&
					  ( ! sitewideDefault && ! categories.length ) &&
					  'publish' === status
					: 'never' === options.frequency && 'publish' === status
		);
		return { draft, test, active: activeWithSitewideDefaultFirst, inactive };
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

	render() {
		const {
			pluginRequirements,
			setError,
			isLoading,
			wizardApiFetch,
			startLoading,
			doneLoading,
		} = this.props;
		const { currentGroup, groups, popups, segments, previewUrl } = this.state;
		const { all } = popups;
		return (
			<WebPreview
				url={ previewUrl }
				renderButton={ ( { showPreview } ) => {
					const sharedProps = {
						currentGroup,
						groups,
						headerText,
						subHeaderText,
						tabbedNavigation,
						setError,
						isLoading,
						startLoading,
						doneLoading,
						wizardApiFetch,
						segments,
					};
					const popupManagementSharedProps = {
						...sharedProps,
						setSitewideDefaultPopup: this.setSitewideDefaultPopup,
						setTermsForPopup: this.setTermsForPopup,
						updatePopup: this.updatePopup,
						deletePopup: this.deletePopup,
						previewPopup: popup =>
							this.setState( { previewUrl: this.previewUrlForPopup( popup ) }, () =>
								showPreview()
							),
						publishPopup: this.publishPopup,
					};
					return (
						<HashRouter hashType="slash">
							<Switch>
								{ pluginRequirements }
								<Route
									path="/campaigns"
									render={ () => (
										<PopupGroup
											{ ...popupManagementSharedProps }
											items={ all }
											buttonText={ __( 'Add new Campaign', 'newspack' ) }
											buttonAction="/wp-admin/post-new.php?post_type=newspack_popups_cpt"
											emptyMessage={ __( 'No Campaigns have been created yet.', 'newspack' ) }
											setCurrentGroup={ this.setCurrentGroup }
											unsetCurrentGroup={ this.unsetCurrentGroup }
										/>
									) }
								/>
								<Route
									path="/segmentation/:id?"
									render={ props => (
										<Segmentation
											{ ...props }
											{ ...sharedProps }
											buttonText={
												props.location.pathname.match( /^\/segmentation\/?$/ ) &&
												__( 'Add new segment', 'newspack' )
											}
											buttonAction="#/segmentation/new"
											setSegments={ segmentsList => this.setState( { segments: segmentsList } ) }
										/>
									) }
								/>
								<Route path="/analytics" render={ () => <Analytics { ...sharedProps } /> } />
								<Route path="/preview" render={ () => <Preview { ...sharedProps } /> } />
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
