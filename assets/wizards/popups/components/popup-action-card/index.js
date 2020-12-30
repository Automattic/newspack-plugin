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
	setCategoriesForPopup,
	setSitewideDefaultPopup,
	publishPopup,
	updatePopup,
} ) => {
	const [ categoriesVisibility, setCategoriesVisibility ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const { id, categories, title, sitewide_default: sitewideDefault, status } = popup;
	return (
		<ActionCard
			isSmall
			className={ className }
			title={ title.length ? decodeEntities( title ) : __( '(no title)', 'newspack' ) }
			key={ id }
			description={ description }
			actionText={
				<Fragment>
					{ ! sitewideDefault && (
						<Tooltip text={ __( 'Category filtering', 'newspack' ) }>
							<Button
								className="icon-only"
								onClick={ () => setCategoriesVisibility( ! categoriesVisibility ) }
							>
								<Icon icon={ menu } />
							</Button>
						</Tooltip>
					) }
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
							onFocusOutside={ () => this.setState( { popoverVisibility: false } ) }
							popup={ popup }
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
				<CategoryAutocomplete
					value={ categories || [] }
					onChange={ tokens => setCategoriesForPopup( id, tokens ) }
					label={ __( 'Category filtering', 'newspack ' ) }
					disabled={ sitewideDefault }
				/>
			) }
		</ActionCard>
	);
};
export default PopupActionCard;
