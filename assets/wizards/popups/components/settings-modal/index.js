/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import {
	CategoryAutocomplete,
	FormTokenField,
	Modal,
	SelectControl,
	Settings,
	Button,
	hooks,
} from '../../../../components/src';
import { frequenciesForPopup, isOverlay, placementsForPopups } from '../../utils';

const { SettingsCard, SettingsSection } = Settings;

const PromptSettingsModal = ( { prompt, disabled, onClose, segments, updatePopup } ) => {
	const [ promptConfig, setPromptConfig ] = hooks.useObjectState( prompt );

	const handleSave = () => {
		updatePopup( promptConfig ).then( onClose );
	};

	const assignedSegmentsIds = ( promptConfig.options.selected_segment_id || '' ).split( ',' );

	return (
		<Modal title={ prompt.title } onRequestClose={ onClose }>
			<Button onClick={ () => onClose() } className="screen-reader-text">
				{ __( 'Close Modal', 'newspack' ) }
			</Button>

			<CategoryAutocomplete
				disabled={ disabled }
				value={ promptConfig.campaign_groups || [] }
				onChange={ tokens => setPromptConfig( { campaign_groups: tokens } ) }
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
							setPromptConfig( { options: { frequency: value } } );
						} }
						options={ frequenciesForPopup( prompt ) }
						value={ promptConfig.options.frequency }
					/>
				</SettingsSection>
				<SettingsSection title={ isOverlay( prompt ) ? __( 'Position' ) : __( 'Placement' ) }>
					<SelectControl
						disabled={ disabled }
						onChange={ value => {
							setPromptConfig( { options: { placement: value } } );
						} }
						options={ placementsForPopups( prompt ) }
						value={ promptConfig.options.placement }
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
							.filter( ( { id } ) => assignedSegmentsIds.indexOf( id ) > -1 )
							.map( segment => segment.name ) }
						onChange={ _segments => {
							const segmentsToAssign = segments
								.filter( segment => -1 < _segments.indexOf( segment.name ) )
								.map( segment => segment.id );
							setPromptConfig( { options: { selected_segment_id: segmentsToAssign.join( ',' ) } } );
						} }
						suggestions={ segments
							.filter( segment => -1 === assignedSegmentsIds.indexOf( segment.id ) )
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
						value={ promptConfig.categories || [] }
						onChange={ tokens => setPromptConfig( { categories: tokens } ) }
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
						value={ promptConfig.tags || [] }
						onChange={ tokens => setPromptConfig( { tags: tokens } ) }
						description={ __(
							'Prompt will only appear on posts with the specified tags.',
							'newspack'
						) }
					/>
				</SettingsSection>
			</SettingsCard>

			<div className="flex justify-between">
				<Button onClick={ onClose } isSecondary>
					{ __( 'Cancel', 'newspack' ) }
				</Button>
				<Button onClick={ handleSave } isPrimary>
					{ __( 'Save', 'newspack' ) }
				</Button>
			</div>
		</Modal>
	);
};
export default PromptSettingsModal;
