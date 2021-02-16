/**
 * Segment group component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useState, Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';
import { Icon, plus, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, Card, Modal, Popover } from '../../../../components/src';
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
	const [ modalVisible, setModalVisible ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
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
			<div className="newspack-campaigns__segment-group__card__segment">
				<div className="newspack-campaigns__segment-group__card__segment-title">
					<h3>
						{ id ? (
							<Button
								href={ `#/segments/${ id }` }
								label={ __( 'Edit Segment ', 'newspack' ) }
								isLink
								showTooltip
								tooltipPosition="bottom center"
							>
								{ __( 'Segment: ', 'newspack' ) }
								{ label }
							</Button>
						) : (
							label
						) }
					</h3>
					<span className="newspack-campaigns__segment-group__description">
						{ id ? descriptionForSegment( segment, categories ) : __( 'No segment', 'newspack' ) }
					</span>
				</div>
				<div className="newspack-campaigns__segment-group__card__segment-actions">
					{ 'unassigned' !== campaignId && (
						<Fragment>
							<Button
								isSmall
								isQuaternary
								onClick={ () => setModalVisible( ! modalVisible ) }
								icon={ plus }
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
						</Fragment>
					) }
					<div>
						<Button
							isQuaternary
							isSmall
							className={ popoverVisibility && 'popover-active' }
							onClick={ () => setPopoverVisibility( ! popoverVisibility ) }
							icon={ moreVertical }
							label={ __( 'More options', 'newspack' ) }
							tooltipPosition="bottom center"
						/>
						{ popoverVisibility && (
							<Popover
								position="bottom left"
								onKeyDown={ event => ESCAPE === event.keyCode && setPopoverVisibility( false ) }
								onFocusOutside={ () => setPopoverVisibility( false ) }
							>
								<MenuItem
									onClick={ () => setPopoverVisibility( false ) }
									className="screen-reader-text"
								>
									{ __( 'Close Popover', 'newspack' ) }
								</MenuItem>
								<SegmentationPreview
									campaign={ campaignId ? campaignToPreview : false }
									segment={ id }
									showUnpublished={ !! campaignId } // Only if previewing a specific campaign/group.
									renderButton={ ( { showPreview } ) => (
										<MenuItem
											className="newspack-button"
											onClick={ () => {
												setPopoverVisibility( false );
												showPreview();
											} }
										>
											{ __( 'Preview Segment', 'newspack' ) }
										</MenuItem>
									) }
								/>
							</Popover>
						) }
					</div>
				</div>
			</div>
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
		</Card>
	);
};
export default SegmentGroup;
