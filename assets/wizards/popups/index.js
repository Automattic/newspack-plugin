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
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/NewReleases';

/**
 * Internal dependencies.
 */
import { WebPreview, withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { PopupGroup } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

const headerText = __( 'Pop-ups', 'newspack' );
const subHeaderText = __( 'Reach your readers with configurable calls-to-action.', 'newspack' );

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
	 * Sort Pop-ups into categories.
	 */
	sortPopups = popups => {
		const overlay = this.sortPopupGroup(
			popups.filter( ( { options } ) => 'inline' !== options.placement )
		);
		const inline = this.sortPopupGroup(
			popups.filter( ( { options } ) => 'inline' === options.placement )
		);
		return { overlay, inline };
	};

	/**
	 * Sort Pop-up groups into categories.
	 */
	sortPopupGroup = popups => {
		const test = popups.filter( ( { options } ) => 'test' === options.frequency );
		const active = popups.filter( ( { categories, options, sitewide_default: sitewideDefault } ) =>
			'inline' === options.placement
				? 'test' !== options.frequency && 'never' !== options.frequency
				: 'test' !== options.frequency && ( sitewideDefault || categories.length )
		);
		const activeWithSitewideDefaultFirst = [
			...active.filter( ( { sitewide_default: sitewideDefault } ) => sitewideDefault ),
			...active.filter( ( { sitewide_default: sitewideDefault } ) => ! sitewideDefault ),
		];
		const inactive = popups.filter(
			( { categories, options, sitewide_default: sitewideDefault } ) =>
				'inline' === options.placement
					? 'never' === options.frequency
					: 'test' !== options.frequency && ( ! sitewideDefault && ! categories.length )
		);
		return { test, active: activeWithSitewideDefaultFirst, inactive };
	};

	previewUrlForPopup = ( { options, id } ) => {
		const { placement, trigger_type: triggerType } = options;
		const previewURL =
			'inline' === placement || 'scroll' === triggerType
				? window && window.newspack_popups_data && window.newspack_popups_data.preview_post
				: '/';
		return `${ previewURL }?newspack_popups_preview_id=${ id }`;
	};

	render() {
		const { pluginRequirements } = this.props;
		const { popups, previewUrl } = this.state;
		const { inline, overlay } = popups;
		return (
			<WebPreview
				url={ previewUrl }
				renderButton={ ( { showPreview } ) => (
					<HashRouter hashType="slash">
						<Switch>
							{ pluginRequirements }
							<Route
								path="/overlay"
								render={ () => (
									<PopupGroup
										headerIcon={ <HeaderIcon /> }
										headerText={ headerText }
										subHeaderText={ subHeaderText }
										tabbedNavigation={ tabbedNavigation }
										items={ overlay }
										buttonText={ __( 'Add new Overlay Pop-up', 'newspack' ) }
										buttonAction="/wp-admin/post-new.php?post_type=newspack_popups_cpt"
										setSitewideDefaultPopup={ this.setSitewideDefaultPopup }
										setCategoriesForPopup={ this.setCategoriesForPopup }
										updatePopup={ this.updatePopup }
										deletePopup={ this.deletePopup }
										emptyMessage={ __( 'No Overlay Pop-ups have been created yet.', 'newspack' ) }
										previewPopup={ popup =>
											this.setState( { previewUrl: this.previewUrlForPopup( popup ) }, () =>
												showPreview()
											)
										}
									/>
								) }
							/>
							<Route
								path="/inline"
								render={ () => (
									<PopupGroup
										headerIcon={ <HeaderIcon /> }
										headerText={ headerText }
										subHeaderText={ subHeaderText }
										tabbedNavigation={ tabbedNavigation }
										items={ inline }
										buttonText={ __( 'Add new Inline Pop-up', 'newspack' ) }
										buttonAction="/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=inline"
										setCategoriesForPopup={ this.setCategoriesForPopup }
										updatePopup={ this.updatePopup }
										deletePopup={ this.deletePopup }
										emptyMessage={ __( 'No Inline Pop-ups have been created yet.', 'newspack' ) }
										previewPopup={ popup =>
											this.setState( { previewUrl: this.previewUrlForPopup( popup ) }, () =>
												showPreview()
											)
										}
									/>
								) }
							/>
							<Redirect to="/overlay" />
						</Switch>
					</HashRouter>
				) }
			/>
		);
	}
}

render(
	createElement( withWizard( PopupsWizard, [ 'jetpack', 'newspack-popups' ] ) ),
	document.getElementById( 'newspack-popups-wizard' )
);
