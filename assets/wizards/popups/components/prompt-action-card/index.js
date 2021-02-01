/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { cog, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ActionCard, Button } from '../../../../components/src';
import PrimaryPromptPopover from '../prompt-popovers/primary';
import SecondaryPromptPopover from '../prompt-popovers/secondary';
import { placementForPopup } from '../../utils';
import './style.scss';

const PromptActionCard = props => {
	const [ categoriesVisibility, setCategoriesVisibility ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );

	const { className, description, prompt = {}, segments } = props;
	const { id, edit_link: editLink, title, sitewide_default: sitewideDefault } = prompt;
	return (
		<ActionCard
			isSmall
			badge={ placementForPopup( prompt ) }
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
						<PrimaryPromptPopover
							onFocusOutside={ () => setPopoverVisibility( false ) }
							prompt={ prompt }
							{ ...props }
						/>
					) }
					{ categoriesVisibility && (
						<SecondaryPromptPopover
							onFocusOutside={ () => setCategoriesVisibility( false ) }
							prompt={ prompt }
							segments={ segments }
							{ ...props }
						/>
					) }
				</Fragment>
			}
		></ActionCard>
	);
};
export default PromptActionCard;
