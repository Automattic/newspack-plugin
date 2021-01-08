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
	updatePopup,
} ) => {
	const [ categoriesVisibility, setCategoriesVisibility ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const { id, title, sitewide_default: sitewideDefault, status } = popup;
	return (
		<ActionCard
			isSmall
			className={ className }
			title={ title.length ? decodeEntities( title ) : __( '(no title)', 'newspack' ) }
			key={ id }
			description={ description }
			actionText={
				<Fragment>
					<Tooltip
						text={
							sitewideDefault
								? __( 'Campaign groups', 'newspack' )
								: __( 'Category filtering and campaign groups', 'newspack' )
						}
					>
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
							setSitewideDefaultPopup={ setSitewideDefaultPopup }
							updatePopup={ updatePopup }
							previewPopup={ previewPopup }
							publishPopup={ 'publish' !== status ? publishPopup : null }
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
