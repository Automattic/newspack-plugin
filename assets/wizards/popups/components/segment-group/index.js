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
import PromptActionCard from '../prompt-action-card';
import { descriptionForPopup, getCardClassName } from '../../utils';

import {
	iconInline,
	iconCenterOverlay,
	iconTopOverlay,
	iconBottomOverlay,
	iconAboveHeader,
	iconManualPlacement,
} from './icons';
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
	const { segment, campaignId } = props;
	const [ modalVisible, setModalVisible ] = useState();
	const { label, id, prompts } = segment;
	return (
		<Card isSmall className="newspack-campaigns__segment-group__card">
			<h3 className="newspack-campaigns__segment-group__card__segment">
				{ __( 'Segment: ', 'newspack' ) }
				{ label }
				<SegmentationPreview
					campaignId={ [ campaignId ] }
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
				{ prompts.map( item => (
					<PromptActionCard
						className={ getCardClassName( item ) }
						description={ descriptionForPopup( item ) }
						key={ item.id }
						prompt={ item }
						{ ...props }
					/>
				) ) }
			</Card>
			{ prompts.length < 1 ? <p>{ __( 'No prompts in this segment yet.', 'newspack' ) }</p> : '' }
			{ 'unassigned' !== campaignId && (
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
								<Button href={ addNewURL( null, campaignId, id ) }>
									<Icon icon={ iconInline } />
									{ __( 'Inline', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'overlay-center', campaignId, id ) }>
									<Icon icon={ iconCenterOverlay } />
									{ __( 'Center Overlay', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'overlay-top', campaignId, id ) }>
									<Icon icon={ iconTopOverlay } />
									{ __( 'Top Overlay', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'overlay-bottom', campaignId, id ) }>
									<Icon icon={ iconBottomOverlay } />
									{ __( 'Bottom Overlay', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'above-header', campaignId, id ) }>
									<Icon icon={ iconAboveHeader } />
									{ __( 'Above Header', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'manual', campaignId, id ) }>
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
