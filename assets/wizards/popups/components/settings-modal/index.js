/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import {
	CategoryAutocomplete,
	FormTokenField,
	Modal,
	SelectControl,
	Settings,
} from '../../../../components/src';
import { frequenciesForPopup, isOverlay, placementsForPopups } from '../../utils';

const { SettingsCard, SettingsSection } = Settings;

const PromptSettingsModal = ( {
	prompt,
	disabled,
	onClose,
	segments,
	setTermsForPopup,
	updatePopup,
} ) => {
	const { campaign_groups: campaignGroups, categories, tags, id, options } = prompt;
	const { frequency, placement, selected_segment_id: selectedSegmentId } = options;
	const [ assignedSegments, setAssignedSegments ] = useState( [] );

	useEffect( () => {
		if ( selectedSegmentId ) {
			setAssignedSegments( selectedSegmentId.split( ',' ) );
		} else {
			setAssignedSegments( [] );
		}
	}, [ selectedSegmentId ] );

	return (
		<Modal title={ prompt.title } onRequestClose={ onClose }>
			<MenuItem onClick={ () => onClose() } className="screen-reader-text">
				{ __( 'Close Modal', 'newspack' ) }
			</MenuItem>

			<CategoryAutocomplete
				disabled={ disabled }
				value={ campaignGroups || [] }
				onChange={ tokens => setTermsForPopup( id, tokens, 'newspack_popups_taxonomy' ) }
				label={ __( 'Campaigns', 'newspack' ) }
				taxonomy="newspack_popups_taxonomy"
				description={ __(
					'Assign a prompt to one or more campaigns for easier management.',
					'newspack'
				) }
			/>

			<SettingsCard
				title={ __( 'Settings', 'newspack' ) }
				description={ __( 'When and how should the prompt be displayed.', 'newspack' ) }
			>
				<SettingsSection title={ __( 'Frequency', 'newspack' ) }>
					<SelectControl
						disabled={ disabled }
						onChange={ value => {
							updatePopup( id, { frequency: value } );
						} }
						options={ frequenciesForPopup( prompt ) }
						value={ frequency }
					/>
				</SettingsSection>
				<SettingsSection title={ isOverlay( prompt ) ? __( 'Position' ) : __( 'Placement' ) }>
					<SelectControl
						disabled={ disabled }
						onChange={ value => {
							updatePopup( id, { placement: value } );
						} }
						options={ placementsForPopups( prompt ) }
						value={ placement }
					/>
				</SettingsSection>
			</SettingsCard>

			<SettingsCard
				title={ __( 'Targeting', 'newspack' ) }
				description={ __(
					'Under which conditions should the prompt be displayed. If multiple conditions are set, all will have to be satisfied in order to display the prompt.',
					'newspack'
				) }
			>
				<SettingsSection title={ __( 'Segment', 'newspack' ) }>
					<FormTokenField
						disabled={ disabled }
						isHelpTextHidden
						value={ segments
							.filter( segment => -1 < assignedSegments.indexOf( segment.id ) )
							.map( segment => segment.name ) }
						onChange={ _segments => {
							const segmentsToAssign = segments
								.filter( segment => -1 < _segments.indexOf( segment.name ) )
								.map( segment => segment.id );
							updatePopup( id, { selected_segment_id: segmentsToAssign.join( ',' ) } );
						} }
						suggestions={ segments
							.filter( segment => -1 === assignedSegments.indexOf( segment.id ) )
							.map( segment => segment.name ) }
						description={ __(
							'Prompt will only appear to reader belonging to the specified segments.',
							'newspack'
						) }
					/>
				</SettingsSection>
				<SettingsSection title={ __( 'Post categories', 'newspack ' ) }>
					<CategoryAutocomplete
						disabled={ disabled }
						value={ categories || [] }
						onChange={ tokens => setTermsForPopup( id, tokens, 'category' ) }
						description={ __(
							'Prompt will only appear on posts with the specified categories.',
							'newspack'
						) }
					/>
				</SettingsSection>
				<SettingsSection title={ __( 'Post tags', 'newspack ' ) }>
					<CategoryAutocomplete
						disabled={ disabled }
						taxonomy="tags"
						value={ tags || [] }
						onChange={ tokens => setTermsForPopup( id, tokens, 'post_tag' ) }
						description={ __(
							'Prompt will only appear on posts with the specified tags.',
							'newspack'
						) }
					/>
				</SettingsSection>
			</SettingsCard>
		</Modal>
	);
};
export default PromptSettingsModal;
