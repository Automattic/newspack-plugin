/**
 * Segment group component.
 */

import cookies from 'js-cookie';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { header, layout, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, ButtonCard, Card, Grid, Modal } from '../../../../components/src';
import SegmentationPreview from '../segmentation-preview';
import PromptActionCard from '../prompt-action-card';
import {
	descriptionForPopup,
	descriptionForSegment,
	getCardClassName,
	getFavoriteCategoryNames,
	warningForPopup,
} from '../../utils';
import {
	iconInline,
	iconOverlayBottom,
	iconOverlayCenter,
	iconOverlayTop,
	iconPreview,
	postList,
	blockTable,
} from './icons';
import './style.scss';

const addNewURL = ( placement, campaignId, segmentId ) => {
	const base = '/wp/wp-admin/post-new.php?post_type=newspack_popups_cpt&';
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

const removeCIDCookie = () => {
	if ( newspack_aux_data.popups_cookie_name ) {
		// Remove cookies for all possible domains.
		window.location.host
			.split( '.' )
			.reduce( ( acc, _, i, arr ) => {
				acc.push( arr.slice( -( i + 1 ) ).join( '.' ) );
				return acc;
			}, [] )
			.map( domain =>
				cookies.remove( newspack_aux_data.popups_cookie_name, {
					domain: `.${ domain }`,
				} )
			);
	}
};

const SegmentGroup = props => {
	const { campaignData, campaignId, segment } = props;
	const [ modalVisible, setModalVisible ] = useState( false );
	const [ categories, setCategories ] = useState( [] );
	const { label, id, prompts } = segment;
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
						{ id
							? descriptionForSegment( segment, categories )
							: __( 'All readers, regardless of segment', 'newspack' ) }
					</span>
				</div>
				<div className="newspack-campaigns__segment-group__card__segment-actions">
					<SegmentationPreview
						campaign={ campaignId ? campaignToPreview : false }
						segment={ id }
						showUnpublished={ !! campaignId } // Only if previewing a specific campaign/group.
						onClose={ removeCIDCookie }
						renderButton={ ( { showPreview } ) => (
							<Button
								isQuaternary
								isSmall
								onClick={ () => {
									removeCIDCookie();
									if ( newspack_aux_data.popups_cookie_name ) {
										cookies.set( newspack_aux_data.popups_cookie_name, `preview-${ Date.now() }`, {
											domain: '.' + window.location.host,
										} );
									}

									showPreview();
								} }
								icon={ iconPreview }
								label={ __( 'Preview Segment', 'newspack' ) }
								tooltipPosition="bottom center"
							/>
						) }
					/>
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
									onRequestClose={ () => setModalVisible( false ) }
									shouldCloseOnEsc={ false }
									shouldCloseOnClickOutside={ false }
									isWide
								>
									<Grid gutter={ 32 } columns={ 3 }>
										<ButtonCard
											href={ addNewURL( 'overlay-center', campaignId, id ) }
											title={ __( 'Center Overlay', 'newspack' ) }
											desc={ __( 'Fixed at the center of the screen', 'newspack' ) }
											icon={ iconOverlayCenter }
										/>
										<ButtonCard
											href={ addNewURL( 'overlay-top', campaignId, id ) }
											title={ __( 'Top Overlay', 'newspack' ) }
											desc={ __( 'Fixed at the top of the screen', 'newspack' ) }
											icon={ iconOverlayTop }
										/>
										<ButtonCard
											href={ addNewURL( 'overlay-bottom', campaignId, id ) }
											title={ __( 'Bottom Overlay', 'newspack' ) }
											desc={ __( 'Fixed at the bottom of the screen', 'newspack' ) }
											icon={ iconOverlayBottom }
										/>
										<ButtonCard
											href={ addNewURL( null, campaignId, id ) }
											title={ __( 'Inline', 'newspack' ) }
											desc={ __( 'Embedded in content', 'newspack' ) }
											icon={ iconInline }
										/>
										<ButtonCard
											href={ addNewURL( 'archives', campaignId, id ) }
											title={ __( 'In Archive Pages', 'newspack' ) }
											desc={ __( 'Embedded once or many times in archive pages', 'newspack' ) }
											icon={ postList }
										/>
										<ButtonCard
											href={ addNewURL( 'above-header', campaignId, id ) }
											title={ __( 'Above Header', 'newspack' ) }
											desc={ __( 'Embedded at the very top of the page', 'newspack' ) }
											icon={ header }
										/>
										<ButtonCard
											href={ addNewURL( 'custom', campaignId, id ) }
											title={ __( 'Custom Placement', 'newspack' ) }
											desc={ __( 'Only appears when placed in content', 'newspack' ) }
											icon={ layout }
										/>
										<ButtonCard
											href={ addNewURL( 'manual', campaignId, id ) }
											title={ __( 'Manual Only', 'newspack' ) }
											desc={ __(
												'Only appears where Single Prompt block is inserted',
												'newspack'
											) }
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
						className={ getCardClassName( item ) }
						description={ descriptionForPopup( item ) }
						warning={ warningForPopup( prompts, item ) }
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
