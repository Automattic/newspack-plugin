/**
 * Popups screen.
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	Button,
	CategoryAutocomplete,
	PluginInstaller,
	SelectControl,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';
import './style.scss';

/**
 * Popups Screen
 */
class Popups extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			pluginRequirementsMet: false,
		};
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirementsMet } = this.state;
		const { popups, setSiteWideDefaultPopup, setCategoriesForPopup } = this.props;
		const hasPopups = popups && popups.length > 0;
		if ( ! pluginRequirementsMet ) {
			return (
				<PluginInstaller
					plugins={ [ 'newspack-popups' ] }
					onStatus={ ( { complete } ) => this.setState( { pluginRequirementsMet: complete } ) }
				/>
			);
		}

		return (
			<Fragment>
				<ActionCard
					title={ __( 'Newspack Pop-ups' ) }
					description={ __( 'AMP-compatible popup notifications.' ) }
					actionText={ __( 'Manage' ) }
					href="edit.php?post_type=newspack_popups_cpt"
				/>
				{ hasPopups && (
					<Fragment>
						<hr />
						<h2>{ __( 'Configure active Pop-up' ) }</h2>
						<SelectControl
							label={ __( 'Sitewide default' ) }
							value={ popups.find( popup => popup.sitewide_default ) }
							options={ [
								{ value: '', label: __( '- Select -' ), disabled: true },
								...popups.map( popup => ( {
									value: popup.id,
									label: popup.title,
									disabled: popup.categories.length,
								} ) ),
							] }
							onChange={ setSiteWideDefaultPopup }
						/>
						<h2>{ __( 'Category Filtering' ) }</h2>
					</Fragment>
				) }
				{ hasPopups &&
					popups
						// The sitewide default should not be shown in this area.
						.map( popup => {
							const { categories } = popup;
							return (
								<div className="newspack-engagement__popups-row" key={ popup.id }>
									{ popup.sitewide_default ? (
										<TextControl
											disabled
											label={ popup.title }
											value={ __( 'Sitewide default', 'newspack' ) }
										/>
									) : (
										<CategoryAutocomplete
											value={ categories || [] }
											suggestions={ this.fetchSuggestions }
											onChange={ tokens => setCategoriesForPopup( popup.id, tokens ) }
											label={ popup.title }
											disabled={ popup.sitewide_default }
										/>
									) }
								</div>
							);
						} ) }
				<div className="newspack-buttons-card">
					<Button href="/wp-admin/post-new.php?post_type=newspack_popups_cpt" isPrimary>
						{ hasPopups
							? __( 'Add new Pop-up', 'newspack' )
							: __( 'Add first Pop-up', 'newspack' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withWizardScreen( Popups );
