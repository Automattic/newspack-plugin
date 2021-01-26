/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { Tooltip } from '@wordpress/components';
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
	warning,
	deletePopup,
	popup = {},
	previewPopup,
	setTermsForPopup,
	segments,
	publishPopup,
	unpublishPopup,
	updatePopup,
} ) => {
	const [ categoriesVisibility, setCategoriesVisibility ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const { id, edit_link: editLink, title, status } = popup;
	return (
		<ActionCard
			isSmall
			badge={ placementForPopup( popup ) }
			className={ className }
			title={ title.length ? decodeEntities( title ) : __( '(no title)', 'newspack' ) }
			titleLink={ decodeEntities( editLink ) }
			key={ id }
			description={ description }
			notificationLevel="error"
			notification={ warning }
			actionText={
				<Fragment>
					<Tooltip text={ __( 'Category filtering and campaign groups', 'newspack' ) }>
						<Button
							className="icon-only"
							onClick={ () => setCategoriesVisibility( ! categoriesVisibility ) }
						>
							<Icon icon={ cog } />
						</Button>
					</Tooltip>
					<Tooltip text={ __( 'More options', 'newspack' ) }>
						<Button
							className="icon-only"
							onClick={ () => setPopoverVisibility( ! popoverVisibility ) }
						>
							<Icon icon={ moreVertical } />
						</Button>
					</Tooltip>
					{ popoverVisibility && (
						<PrimaryPopupPopover
							deletePopup={ deletePopup }
							onFocusOutside={ () => setPopoverVisibility( false ) }
							popup={ popup }
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
