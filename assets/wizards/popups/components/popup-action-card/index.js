/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { Icon, cog, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ActionCard, Button } from '../../../../components/src';
import PrimaryPopupPopover from '../popup-popover/primary';
import SecondaryPopupPopover from '../popup-popover/secondary';
import './style.scss';

const placementForPopup = ( { options: { frequency, placement } } ) => {
	if ( 'manual' === frequency ) {
		return __( 'Manual Placement', 'newspack' );
	}
	return {
		center: __( 'Center Overlay', 'newspack' ),
		top: __( 'Top Overlay', 'newspack' ),
		bottom: __( 'Bottom Overlay', 'newspack' ),
		inline: __( 'Inline', 'newspack' ),
		above_header: __( 'Above Header', 'newspack' ),
	}[ placement ];
};

const PopupActionCard = ( {
	className,
	description,
	deletePopup,
	popup = {},
	previewPopup,
	setTermsForPopup,
	segments,
	setSitewideDefaultPopup,
	publishPopup,
	unpublishPopup,
	updatePopup,
} ) => {
	const [ categoriesVisibility, setCategoriesVisibility ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const { id, edit_link: editLink, title, sitewide_default: sitewideDefault, status } = popup;
	return (
		<ActionCard
			isSmall
			badge={ placementForPopup( popup ) }
			className={ className }
			title={ title.length ? decodeEntities( title ) : __( '(no title)', 'newspack' ) }
			titleLink={ decodeEntities( editLink ) }
			key={ id }
			description={ description }
			actionText={
				<Fragment>
					<Button
						isQuaternary
						isSmall
						className={ categoriesVisibility && 'popover-active' }
						onClick={ () => setCategoriesVisibility( ! categoriesVisibility ) }
						icon={ cog }
						label={
							sitewideDefault
								? __( 'Campaign groups', 'newspack' )
								: __( 'Category filtering and campaign groups', 'newspack' )
						}
					/>
					<Button
						isQuaternary
						isSmall
						className={ popoverVisibility && 'popover-active' }
						onClick={ () => setPopoverVisibility( ! popoverVisibility ) }
						icon={ moreVertical }
						label={ __( 'More options', 'newspack' ) }
					/>
					{ popoverVisibility && (
						<PrimaryPopupPopover
							deletePopup={ deletePopup }
							onFocusOutside={ () => setPopoverVisibility( false ) }
							popup={ popup }
							setSitewideDefaultPopup={ setSitewideDefaultPopup }
							updatePopup={ updatePopup }
							previewPopup={ previewPopup }
							publishPopup={ 'publish' !== status ? publishPopup : null }
							unpublishPopup={ 'publish' === status ? unpublishPopup : null }
						/>
					) }
					{ categoriesVisibility && (
						<SecondaryPopupPopover
							deletePopup={ deletePopup }
							onFocusOutside={ () => setCategoriesVisibility( false ) }
							popup={ popup }
							segments={ segments }
							setTermsForPopup={ setTermsForPopup }
							updatePopup={ updatePopup }
						/>
					) }
				</Fragment>
			}
		></ActionCard>
	);
};
export default PopupActionCard;
