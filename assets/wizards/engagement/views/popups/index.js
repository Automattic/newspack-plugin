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
	withWizardScreen,
} from '../../../../components/src';

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
				<hr />
				<h2>{ __( 'Configure active Pop-up' ) }</h2>
				<SelectControl
					label={ __( 'Sitewide default' ) }
					value={ popups.find( popup => popup.sitewide_default ) }
					options={ [
						{ value: '', label: __( '- Select -' ), disabled: true },
						...popups
							// Popups with categories cannot be sitewide default, so they are excluded from this Select.
							.filter( popup => ! popup.categories || ! popup.categories.length )
							.map( popup => ( {
								value: popup.id,
								label: popup.title,
							} ) ),
					] }
					onChange={ setSiteWideDefaultPopup }
				/>
				<h2>{ __( 'Category Filtering' ) }</h2>
				{ popups
					// The sitewide default should not be shown in this area.
					.filter( popup => ! popup.sitewide_default )
					.map( popup => {
						const { categories } = popup;
						return (
							<div className="newspack-engagement__popups_row" key={ popup.id }>
								<CategoryAutocomplete
									value={ categories || [] }
									suggestions={ this.fetchSuggestions }
									onChange={ tokens => setCategoriesForPopup( popup.id, tokens ) }
									label={ popup.title }
								/>
							</div>
						);
					} ) }
				<div className="newspack-buttons-card">
					<Button href="/wp-admin/post-new.php?post_type=newspack_popups_cpt" isPrimary>
						{ __( 'Add new Pop-up' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withWizardScreen( Popups );
