/**
 * Segment group component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useState } from '@wordpress/element';
import { Icon, plusCircle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, Card, Modal } from '../../../../components/src';
import SegmentationPreview from '../segmentation-preview';
import PromptActionCard from '../prompt-action-card';
import {
	descriptionForPopup,
	descriptionForSegment,
	getCardClassName,
	getFavoriteCategoryNames,
	warningForPopup,
} from '../../utils';
import { CampaignsContext } from '../../contexts';

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
	const { campaignData, campaignId, segment } = props;
	const [ modalVisible, setModalVisible ] = useState();
	const [ categories, setCategories ] = useState( [] );
	const { label, id, prompts } = segment;
	const allPrompts = useContext( CampaignsContext );
	const campaignToPreview = 'unassigned' !== campaignId ? parseInt( campaignId ) : -1;

	useEffect( () => {
		updateCategories();
	}, [ segment ] );

	const updateCategories = async () => {
		if ( 0 < segment.configuration?.favorite_categories?.length ) {
			setCategories( await getFavoriteCategoryNames( segment.configuration.favorite_categories ) );
		}
	};

	let emptySegmentText;
	if ( 'unassigned' === campaignId ) {
		emptySegmentText = __( 'No unassigned prompts in this segment.', 'newspack' );
	} else if ( campaignData ) {
		emptySegmentText =
			__( 'No prompts in this segment for', 'newspack' ) + ' ' + campaignData.name + '.';
	} else {
		emptySegmentText = __( 'No active prompts in this segment.', 'newspack' );
	}
	return (
		<Card isSmall className="newspack-campaigns__segment-group__card">
			<h3 className="newspack-campaigns__segment-group__card__segment">
				<a href={ `#/segments/${ id }` }>
					{ id ? __( 'Segment: ', 'newspack' ) : '' }
					{ label }
					<span className="newspack-campaigns__segment-group__description">
						{ descriptionForSegment( segment, categories ) }
					</span>
				</a>
				<SegmentationPreview
					campaign={ campaignId ? campaignToPreview : false }
					segment={ id }
					showUnpublished={ !! campaignId } // Only if previewing a specific campaign/group.
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
						warning={ warningForPopup( allPrompts, item ) }
						key={ item.id }
						prompt={ item }
						{ ...props }
					/>
				) ) }
			</Card>
			{ prompts.length < 1 ? <p>{ emptySegmentText }</p> : '' }
			{ 'unassigned' !== campaignId && (
				<div className="newspack-campaigns__segment-group__add-new-wrap">
					<Button
						isSmall
						isQuaternary
						onClick={ () => setModalVisible( ! modalVisible ) }
						icon={ plusCircle }
						label={ __( 'Add New Prompt', 'newspack' ) }
						tooltipPosition="bottom center"
					/>
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
									<Icon icon={ iconInline } height={ 48 } width={ 48 } />
									{ __( 'Inline', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'overlay-center', campaignId, id ) }>
									<Icon icon={ iconCenterOverlay } height={ 48 } width={ 48 } />
									{ __( 'Center Overlay', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'overlay-top', campaignId, id ) }>
									<Icon icon={ iconTopOverlay } height={ 48 } width={ 48 } />
									{ __( 'Top Overlay', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'overlay-bottom', campaignId, id ) }>
									<Icon icon={ iconBottomOverlay } height={ 48 } width={ 48 } />
									{ __( 'Bottom Overlay', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'above-header', campaignId, id ) }>
									<Icon icon={ iconAboveHeader } height={ 48 } width={ 48 } />
									{ __( 'Above Header', 'newspack' ) }
								</Button>
								<Button href={ addNewURL( 'manual', campaignId, id ) }>
									<Icon icon={ iconManualPlacement } height={ 48 } width={ 48 } />
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
