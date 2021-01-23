/**
 * Campaign Group Component
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { Icon, cog, moreVertical } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, Popover } from '../../../../components/src';
import CampaignSegment from '../campaign-segment';
import './style.scss';

const CampaignGroup = props => {
	const { deleteTerm, group, manageCampaignGroup, segments } = props;
	const { activeCount, allCampaigns, label, id, isActive, segments: groupSegments } = group;
	const [ popoverVisibility, setPopoverVisibility ] = useState();
	const [ isOpen, setIsOpen ] = useState( isActive );
	const [ newGroupName, setNewGroupName ] = useState( '' );
	return (
		<Fragment>
			<div className="newspack-campaigns__popup-group__campaigns-group-wrapper">
				<ActionCard
					badge={ isActive && __( 'Active', 'newspack' ) }
					className={ isActive ? 'newspack-card__is-supported' : 'newspack-card__is-disabled' }
					description={
						allCampaigns.length +
						' ' +
						( 1 === allCampaigns ? __( 'prompt', 'newspack' ) : __( 'prompts', 'newspack' ) )
					}
					isSmall
					title={ label }
					titleLink={ () => setIsOpen( ! isOpen ) }
					actionText={
						<Button isLink onClick={ () => setPopoverVisibility( ! popoverVisibility ) }>
							<Icon icon={ moreVertical } />
						</Button>
					}
				/>
				{ popoverVisibility && (
					<Popover
						className="newspack-popover__campaigns__group-popover"
						position="bottom left"
						onFocusOutside={ () => setPopoverVisibility( false ) }
						onKeyDown={ event => ESCAPE === event.keyCode && setPopoverVisibility( false ) }
					>
						<MenuItem onClick={ () => onFocusOutside() } className="screen-reader-text">
							{ __( 'Close Popover', 'newspack' ) }
						</MenuItem>

						{ activeCount < allCampaigns.length && (
							<MenuItem
								onClick={ () => manageCampaignGroup( allCampaigns ) }
								className="newspack-button"
							>
								{ __( 'Activate', 'newspack' ) }
							</MenuItem>
						) }
						{ activeCount > 1 && (
							<MenuItem
								onClick={ () => manageCampaignGroup( allCampaigns, 'DELETE' ) }
								className="newspack-button"
							>
								{ __( 'Deactivate', 'newspack' ) }
							</MenuItem>
						) }
						<MenuItem onClick={ () => null } className="newspack-button">
							{ __( 'Duplicate (non-functional)', 'newspack' ) }
						</MenuItem>
						<MenuItem onClick={ () => null } className="newspack-button">
							{ __( 'Archive (non-functional)', 'newspack' ) }
						</MenuItem>
						<MenuItem onClick={ () => deleteTerm( id ) } className="newspack-button">
							{ __( 'Delete', 'newspack' ) }
						</MenuItem>
					</Popover>
				) }
			</div>
			{ isOpen &&
				groupSegments.map( segment => (
					<CampaignSegment { ...props } segment={ segment } groupId={ id } />
				) ) }
		</Fragment>
	);
};
export default CampaignGroup;
