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
import HeaderIcon from '@material-ui/icons/NewReleases';
import { stringify } from 'qs';
import { groupBy, mapValues } from 'lodash';

/**
 * Internal dependencies.
 */
import { WebPreview, withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { PopupGroup, Analytics } from './views';
import { isOverlay } from './utils';

const { HashRouter, Redirect, Route, Switch } = Router;

const headerText = __( 'Campaigns', 'newspack' );
const subHeaderText = __( 'Reach your readers with configurable campaigns.', 'newspack' );

const tabbedNavigation = [
	{
		label: __( 'Overlay', 'newpack' ),
		path: '/overlay',
		exact: true,
	},
	{
		label: __( 'Inline', 'newpack' ),
		path: '/inline',
		exact: true,
	},
	{
		label: __( 'Analytics', 'newpack' ),
		path: '/analytics',
		exact: true,
	},
];

class PopupsWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			popups: {
				inline: [],
				overlay: [],
			},
			previewUrl: null,
		};
	}
	onWizardReady = () => {
		this.getPopups();
	};

	/**
	 * Get Pop-ups for the current wizard.
	 */
	getPopups = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-popups-wizard/',
		} )
			.then( ( { popups } ) => this.setState( { popups: this.sortPopups( popups ) } ) )
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
	 * Set categories for a Popup.
	 *
	 * @param {number} popupId ID of the Popup to alter.
	 * @param {Array} categories Array of categories to assign to the Popup.
	 */
	setCategoriesForPopup = ( popupId, categories ) => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/popup-categories/${ popupId }`,
			method: 'POST',
			data: {
				categories,
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
	sortPopups = popups =>
		mapValues(
			groupBy( popups, popup => ( isOverlay( popup ) ? 'overlay' : 'inline' ) ),
			this.sortPopupGroup
		);

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
		const { pluginRequirements, setError, isLoading, startLoading, doneLoading } = this.props;
		const { popups, previewUrl } = this.state;
		const { inline, overlay } = popups;
		return (
			<WebPreview
				url={ previewUrl }
				renderButton={ ( { showPreview } ) => {
					const sharedProps = {
						headerIcon: <HeaderIcon />,
						headerText,
						subHeaderText,
						tabbedNavigation,
						setError,
						isLoading,
						startLoading,
						doneLoading,
					};
					const popupManagementSharedProps = {
						...sharedProps,
						setSitewideDefaultPopup: this.setSitewideDefaultPopup,
						setCategoriesForPopup: this.setCategoriesForPopup,
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
									path="/overlay"
									render={ () => (
										<PopupGroup
											{ ...popupManagementSharedProps }
											items={ overlay }
											buttonText={ __( 'Add new Overlay Campaign', 'newspack' ) }
											buttonAction="/wp-admin/post-new.php?post_type=newspack_popups_cpt"
											emptyMessage={ __(
												'No Overlay Campaigns have been created yet.',
												'newspack'
											) }
										/>
									) }
								/>
								<Route
									path="/inline"
									render={ () => (
										<PopupGroup
											{ ...popupManagementSharedProps }
											items={ inline }
											buttonText={ __( 'Add new Inline Campaign', 'newspack' ) }
											buttonAction="/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=inline"
											emptyMessage={ __(
												'No Inline Campaigns have been created yet.',
												'newspack'
											) }
										/>
									) }
								/>
								<Route path="/analytics" render={ () => <Analytics { ...sharedProps } isWide /> } />
								<Redirect to="/overlay" />
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
