/**
 * Segment group component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, Card, Modal } from '../../../../components/src';
import SegmentationPreview from '../segmentation-preview';
import PopupActionCard from '../popup-action-card';
import {
	descriptionForPopup,
	filterOutUncategorized,
	frequencyForPopup,
	getCardClassName,
	isOverlay,
} from '../../utils';
import {
	iconInline,
	iconCenterOverlay,
	iconTopOverlay,
	iconBottomOverlay,
	iconAboveHeader,
	iconManualPlacement,
} from './icons';
import './style.scss';

const SegmentGroup = ( {
	segment,
	campaignGroup,
	deletePopup,
	previewPopup,
	segments,
	setTermsForPopup,
	setSitewideDefaultPopup,
	updatePopup,
	publishPopup,
	unpublishPopup,
} ) => {
	const [ modalVisible, setModalVisible ] = useState();
	const { label, id, items } = segment;
	return (
		<Card isSmall className="newspack-campaigns__segment-group__card">
			<h3 className="newspack-campaigns__segment-group__card__segment">
				{ __( 'Segment: ', 'newspack' ) }
				{ label }
				<SegmentationPreview
					campaignGroups={ [ campaignGroup ] }
					segment={ id }
					showUnpublished={ true } // Do we need a control for this?
					renderButton={ ( { showPreview } ) => (
						<Button isTertiary isSmall isLink onClick={ () => showPreview() }>
							{ __( 'Preview', 'newspack' ) }
						</Button>
					) }
				/>
			</h3>
			<Card noBorder className="newspack-campaigns__segment-group__action-cards">
				{ items.map( item => (
					<PopupActionCard
						className={ getCardClassName( item ) }
						deletePopup={ deletePopup }
						description={ descriptionForPopup( item, segments ) }
						key={ item.id }
						popup={ item }
						previewPopup={ previewPopup }
						segments={ segments }
						setTermsForPopup={ setTermsForPopup }
						setSitewideDefaultPopup={ setSitewideDefaultPopup }
						updatePopup={ updatePopup }
						publishPopup={ publishPopup }
						unpublishPopup={ unpublishPopup }
					/>
				) ) }
			</Card>
			{ items.length < 1 ? <p>{ __( 'No prompts in this segment yet.', 'newspack' ) }</p> : '' }
			{ parseInt( campaignGroup ) > 0 && (
				<div className="newspack-campaigns__segment-group__add-new-wrap">
					<Button isSmall isTertiary onClick={ () => setModalVisible( ! modalVisible ) }>
						{ __( 'Add New Prompt', 'newspack' ) }
					</Button>
					{ modalVisible && (
						<Modal
							title={ __( 'Add New Prompt', 'newspack' ) }
							className="newspack-campaigns__segment-group__add-new-button__modal"
							onRequestClose={ () => setModalVisible( false ) }
							shouldCloseOnEsc={ false }
							shouldCloseOnClickOutside={ false }
						>
							<Card buttonsCard noBorder className="newspack-card__buttons-prompt">
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconInline } />
									{ __( 'Inline', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-center&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconCenterOverlay } />
									{ __( 'Center Overlay', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-top&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconTopOverlay } />
									{ __( 'Top Overlay', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-bottom&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconBottomOverlay } />
									{ __( 'Bottom Overlay', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=above-header&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconAboveHeader } />
									{ __( 'Above Header', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=manual&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconManualPlacement } />
									{ __( 'Manual Placement', 'newspack' ) }
								</Button>
							</Card>
						</Modal>
					) }
				</div>
			) }
		</Card>
	);
};
export default SegmentGroup;
