/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen, ActionCardSections } from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';

/**
 * Popup group screen
 */

class PopupGroup extends Component {
	/**
	 * Construct the appropriate description for a single Pop-up based on categories and sitewide default status.
	 *
	 * @param {Object} popup object.
	 */
	descriptionForPopup = ( { categories, sitewide_default: sitewideDefault, options } ) => {
		const description = [];
		if ( sitewideDefault ) {
			description.push( __( 'Sitewide default', 'newspack' ) );
		}
		if ( options.placement === 'above_header' ) {
			description.push( __( 'Above header', 'newspack' ) );
		}
		if ( categories.length > 0 ) {
			description.push(
				__( 'Categories: ', 'newspack' ) + categories.map( category => category.name ).join( ', ' )
			);
		}
		return description.join( ' | ' );
	};

	/**
	 * Render.
	 */
	render() {
		const {
			deletePopup,
			emptyMessage,
			items: { active = [], draft = [], test = [], inactive = [] },
			previewPopup,
			setCategoriesForPopup,
			setSitewideDefaultPopup,
			publishPopup,
			updatePopup,
		} = this.props;

		const getCardClassName = ( { key }, { sitewide_default } ) =>
			( {
				active: sitewide_default ? 'newspack-card__is-primary' : 'newspack-card__is-supported',
				test: 'newspack-card__is-secondary',
				inactive: 'newspack-card__is-disabled',
				draft: 'newspack-card__is-disabled',
			}[ key ] );

		return (
			<ActionCardSections
				sections={ [
					{ key: 'active', label: __( 'Active', 'newspack' ), items: active },
					{ key: 'draft', label: __( 'Draft', 'newspack' ), items: draft },
					{ key: 'test', label: __( 'Test', 'newspack' ), items: test },
					{ key: 'inactive', label: __( 'Inactive', 'newspack' ), items: inactive },
				] }
				renderCard={ ( popup, section ) => (
					<PopupActionCard
						className={ getCardClassName( section, popup ) }
						deletePopup={ deletePopup }
						description={ this.descriptionForPopup( popup ) }
						key={ popup.id }
						popup={ popup }
						previewPopup={ previewPopup }
						setCategoriesForPopup={ setCategoriesForPopup }
						setSitewideDefaultPopup={ setSitewideDefaultPopup }
						updatePopup={ updatePopup }
						publishPopup={ section.key === 'draft' ? publishPopup : undefined }
					/>
				) }
				emptyMessage={ emptyMessage }
			/>
		);
	}
}

export default withWizardScreen( PopupGroup );
