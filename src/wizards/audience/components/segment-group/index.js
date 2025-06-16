/**
 * Segment group component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { blockTable, header, layout, postList } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, ButtonCard, Card, Grid, Modal } from '../../../../components/src';
import SegmentationPreview from '../segmentation-preview';
import PromptActionCard from '../prompt-action-card';
import { promptDescription, segmentDescription, getCardClassName, warningForPopup } from '../../views/campaigns/utils';
import { overlayBottom, overlayInline, overlayCenter, overlayTop } from '../../../../icons';
import './style.scss';

const addNewURL = ( placement, campaignId, segmentId ) => {
	const base = '/wp-admin/post-new.php?post_type=newspack_popups_cpt&';
	const params = [];
	if ( placement ) {
		params.push( `placement=${ placement }` );
	}
	if ( +campaignId > 0 ) {
		params.push( `group=${ campaignId }` );
	}
	if ( segmentId ) {
		params.push( `segment=${ segmentId }` );
	}
	return base + params.join( '&' );
};

const SegmentGroup = props => {
	const { campaignData, campaignId, segment } = props;
	const [ modalVisible, setModalVisible ] = useState( false );
	const { label, id, prompts } = segment;
	const campaignToPreview = 'unassigned' !== campaignId ? parseInt( campaignId ) : -1;

	let emptySegmentText;
	if ( 'unassigned' === campaignId ) {
		emptySegmentText = __( 'No unassigned prompts in this segment.', 'newspack-plugin' );
	} else if ( campaignData ) {
		emptySegmentText = __( 'No prompts in this segment for', 'newspack-plugin' ) + ' ' + campaignData.name + '.';
	} else {
		emptySegmentText = __( 'No active prompts in this segment.', 'newspack-plugin' );
	}

	const description = segmentDescription( segment );
	return (
		<Card isSmall className="newspack-campaigns__segment-group__card">
			<div className="newspack-campaigns__segment-group__card__segment">
				<div className="newspack-campaigns__segment-group__card__segment-title">
					<h3>
						{ id ? (
							<Button
								href={ `#/segments/${ id }` }
								label={ __( 'Edit Segment ', 'newspack-plugin' ) }
								isLink
								showTooltip
								tooltipPosition="bottom center"
							>
								{ __( 'Segment: ', 'newspack-plugin' ) }
								{ label }
							</Button>
						) : (
							label
						) }
					</h3>
					<span className="newspack-campaigns__segment-group__description">
						{ id ? description() : __( 'All readers, regardless of segment', 'newspack-plugin' ) }
					</span>
				</div>
				<div className="newspack-campaigns__segment-group__card__segment-actions">
					<SegmentationPreview
						campaign={ campaignId ? campaignToPreview : false }
						segment={ id }
						showUnpublished={ !! campaignId } // Only if previewing a specific campaign/group.
						renderButton={ ( { showPreview } ) => (
							<Button isSmall variant="tertiary" onClick={ () => showPreview() }>
								{ __( 'Preview Segment', 'newspack-plugin' ) }
							</Button>
						) }
					/>
					{ 'unassigned' !== campaignId && (
						<Fragment>
							<Button isSmall variant="secondary" onClick={ () => setModalVisible( ! modalVisible ) }>
								{ __( 'Add New Prompt', 'newspack-plugin' ) }
							</Button>
							{ modalVisible && (
								<Modal
									title={ __( 'Add New Prompt', 'newspack-plugin' ) }
									onRequestClose={ () => setModalVisible( false ) }
									shouldCloseOnEsc={ false }
									shouldCloseOnClickOutside={ false }
									isWide
								>
									<Grid gutter={ 32 } columns={ 3 }>
										<ButtonCard
											href={ addNewURL( 'overlay-center', campaignId, id ) }
											title={ __( 'Center Overlay', 'newspack-plugin' ) }
											desc={ __( 'Fixed at the center of the screen', 'newspack-plugin' ) }
											icon={ overlayCenter }
										/>
										<ButtonCard
											href={ addNewURL( 'overlay-top', campaignId, id ) }
											title={ __( 'Top Overlay', 'newspack-plugin' ) }
											desc={ __( 'Fixed at the top of the screen', 'newspack-plugin' ) }
											icon={ overlayTop }
										/>
										<ButtonCard
											href={ addNewURL( 'overlay-bottom', campaignId, id ) }
											title={ __( 'Bottom Overlay', 'newspack-plugin' ) }
											desc={ __( 'Fixed at the bottom of the screen', 'newspack-plugin' ) }
											icon={ overlayBottom }
										/>
										<ButtonCard
											href={ addNewURL( null, campaignId, id ) }
											title={ __( 'Inline', 'newspack-plugin' ) }
											desc={ __( 'Embedded in content', 'newspack-plugin' ) }
											icon={ overlayInline }
										/>
										<ButtonCard
											href={ addNewURL( 'archives', campaignId, id ) }
											title={ __( 'In Archive Pages', 'newspack-plugin' ) }
											desc={ __( 'Embedded once or many times in archive pages', 'newspack-plugin' ) }
											icon={ postList }
										/>
										<ButtonCard
											href={ addNewURL( 'above-header', campaignId, id ) }
											title={ __( 'Above Header', 'newspack-plugin' ) }
											desc={ __( 'Embedded at the very top of the page', 'newspack-plugin' ) }
											icon={ header }
										/>
										<ButtonCard
											href={ addNewURL( 'custom', campaignId, id ) }
											title={ __( 'Custom Placement', 'newspack-plugin' ) }
											desc={ __( 'Only appears when placed in content', 'newspack-plugin' ) }
											icon={ layout }
										/>
										<ButtonCard
											href={ addNewURL( 'manual', campaignId, id ) }
											title={ __( 'Manual Only', 'newspack-plugin' ) }
											desc={ __( 'Only appears where Single Prompt block is inserted', 'newspack-plugin' ) }
											icon={ blockTable }
										/>
									</Grid>
								</Modal>
							) }
						</Fragment>
					) }
				</div>
			</div>
			<Card noBorder className="newspack-campaigns__segment-group__action-cards">
				{ prompts.map( item => (
					<PromptActionCard
						className={ getCardClassName( item.status, segment.configuration.is_disabled ) }
						description={ promptDescription( item ) }
						warning={ warningForPopup( prompts, item ) }
						key={ item.id }
						prompt={ item }
						{ ...props }
					/>
				) ) }
			</Card>
			{ prompts.length < 1 ? <p className="newspack-campaigns__segment-group__empty-segment-text">{ emptySegmentText }</p> : '' }
		</Card>
	);
};
export default SegmentGroup;
