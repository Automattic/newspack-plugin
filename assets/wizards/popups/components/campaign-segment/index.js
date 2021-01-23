/**
 * Campaign Segment Component
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
import PopupActionCard from '../popup-action-card';
import SegmentationPreview from '../segmentation-preview';
import { getCardClassName } from '../../utils';
import './style.scss';

const CampaignSegment = ( {
	groupId,
	segment,
	previewPopup,
	setTermsForPopup,
	segments,
	setSitewideDefaultPopup,
	deletePopup,
	updatePopup,
	publishPopup,
	unpublishPopup,
} ) => {
	const { campaigns, label, id } = segment;
	const [ addNewPopoverIsVisible, setAddNewPopoverIsVisible ] = useState();
	return (
		<div key={ id } className="newspack-campaigns-wizard__campaign-segment-component">
			<ActionCard
				isSmall
				title={ label }
				actionText={
					campaigns.length > 0 && (
						<SegmentationPreview
							campaignGroups={ [ groupId ] }
							segment={ id }
							showUnpublished={ true } // Do we need a control for this?
							renderButton={ ( { showPreview } ) => (
								<Button isTertiary isSmall onClick={ () => showPreview() }>
									{ __( 'Preview', 'newspack' ) }
								</Button>
							) }
						/>
					)
				}
			/>
			<div className="newspack-campaigns__popup-group__segment-group-wrapper">
				{ campaigns.map( campaign => (
					<PopupActionCard
						key={ campaign.id }
						className={ getCardClassName( campaign ) }
						deletePopup={ deletePopup }
						key={ campaign.id }
						popup={ campaign }
						previewPopup={ previewPopup }
						segments={ segments }
						setTermsForPopup={ setTermsForPopup }
						setSitewideDefaultPopup={ setSitewideDefaultPopup }
						updatePopup={ updatePopup }
						publishPopup={ publishPopup }
						unpublishPopup={ unpublishPopup }
					/>
				) ) }
				{ 0 === campaigns.length && (
					<p>{ __( 'No prompts created yet for this segment.', 'newspack' ) }</p>
				) }
				<div className="newspack-campaigns-wizard__campaign-segment-component__add-new-button">
					<Button
						isTertiary
						isSmall
						onClick={ () => setAddNewPopoverIsVisible( ! addNewPopoverIsVisible ) }
					>
						{ __( 'Add Prompt', 'newspack' ) }
					</Button>
					{ addNewPopoverIsVisible && (
						<Popover
							className=""
							position="bottom left"
							onFocusOutside={ () => setAddNewPopoverIsVisible( false ) }
							onKeyDown={ event => ESCAPE === event.keyCode && setAddNewPopoverIsVisible( false ) }
						>
							<MenuItem
								onClick={ () => setAddNewPopoverIsVisible( false ) }
								className="screen-reader-text"
							>
								{ __( 'Close Popover', 'newspack' ) }
							</MenuItem>
							<MenuItem
								href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&group=${ groupId }&segment=${ id }` }
							>
								{ __( 'Inline', 'newspack' ) }
							</MenuItem>
							<MenuItem
								href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-center&group=${ groupId }&segment=${ id }` }
							>
								{ __( 'Center Overlay', 'newspack' ) }
							</MenuItem>
							<MenuItem
								href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-top&group=${ groupId }&segment=${ id }` }
							>
								{ __( 'Top Overlay', 'newspack' ) }
							</MenuItem>
							<MenuItem
								href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-bottom&group=${ groupId }&segment=${ id }` }
							>
								{ __( 'Bottom Overlay', 'newspack' ) }
							</MenuItem>
							<MenuItem
								href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=above-header&group=${ groupId }&segment=${ id }` }
							>
								{ __( 'Above Header', 'newspack' ) }
							</MenuItem>
							<MenuItem
								href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=manual&group=${ groupId }&segment=${ id }` }
							>
								{ __( 'Manual Placement', 'newspack' ) }
							</MenuItem>
						</Popover>
					) }
				</div>
			</div>
		</div>
	);
};
export default CampaignSegment;
