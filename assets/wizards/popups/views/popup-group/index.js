/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import { withWizardScreen, ActionCardSections } from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';

const descriptionForPopup = (
	{ categories, sitewide_default: sitewideDefault, options },
	segments
) => {
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
	const descriptionMessages = [];
	switch ( options.placement ) {
		case 'above_header':
			descriptionMessages.push( __( 'Above header', 'newspack' ) );
			break;
		case 'inline':
			descriptionMessages.push( __( 'Inline', 'newspack' ) );
			break;
		default:
			descriptionMessages.push( __( 'Overlay', 'newspack' ) );
			break;
	}
	if ( segment ) {
		descriptionMessages.push( `${ __( 'Segment:', 'newspack' ) } ${ segment.name }` );
	}
	if ( sitewideDefault ) {
		descriptionMessages.push( __( 'Sitewide default', 'newspack' ) );
	}
	if ( categories.length > 0 ) {
		descriptionMessages.push(
			__( 'Categories: ', 'newspack' ) + categories.map( category => category.name ).join( ', ' )
		);
	}
	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

/**
 * Popup group screen
 */
const PopupGroup = ( {
	deletePopup,
	emptyMessage,
	items: { active = [], draft = [], test = [], inactive = [] },
	previewPopup,
	setTermsForPopup,
	setSitewideDefaultPopup,
	publishPopup,
	updatePopup,
	segments,
} ) => {
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
					description={ descriptionForPopup( popup, segments ) }
					key={ popup.id }
					popup={ popup }
					previewPopup={ previewPopup }
					setTermsForPopup={ setTermsForPopup }
					setSitewideDefaultPopup={ setSitewideDefaultPopup }
					updatePopup={ updatePopup }
					publishPopup={ section.key === 'draft' ? publishPopup : undefined }
				/>
			) }
			emptyMessage={ emptyMessage }
		/>
	);
};
export default withWizardScreen( PopupGroup );
