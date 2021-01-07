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
import { Icon, menu, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, CategoryAutocomplete } from '../../../../components/src';
import PopupPopover from '../popup-popover';
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
	const {
		id,
		campaign_groups: campaignGroups,
		categories,
		edit_link: editLink,
		title,
		sitewide_default: sitewideDefault,
		status,
	} = popup;
	return (
		<ActionCard
			isSmall
			className={ className }
			title={ title.length ? decodeEntities( title ) : __( '(no title)', 'newspack' ) }
			titleLink={ decodeEntities( editLink ) }
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
							<Icon icon={ menu } />
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
						<PopupPopover
							deletePopup={ deletePopup }
							onFocusOutside={ () => setPopoverVisibility( false ) }
							popup={ popup }
							segments={ segments }
							setSitewideDefaultPopup={ setSitewideDefaultPopup }
							updatePopup={ updatePopup }
							previewPopup={ previewPopup }
							publishPopup={ 'publish' !== status ? publishPopup : null }
						/>
					) }
				</Fragment>
			}
		>
			{ categoriesVisibility && (
				<Fragment>
					<CategoryAutocomplete
						value={ campaignGroups || [] }
						onChange={ tokens => setTermsForPopup( id, tokens, 'newspack_popups_taxonomy' ) }
						label={ __( 'Campaign groups', 'newspack' ) }
						taxonomy="newspack_popups_taxonomy"
					/>
					{ ! sitewideDefault && (
						<CategoryAutocomplete
							value={ categories || [] }
							onChange={ tokens => setTermsForPopup( id, tokens, 'category' ) }
							label={ __( 'Category filtering', 'newspack ' ) }
							disabled={ sitewideDefault }
						/>
					) }
				</Fragment>
			) }
		</ActionCard>
	);
};
export default PopupActionCard;
