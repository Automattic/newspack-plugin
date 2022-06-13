/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import {
	Button,
	Card,
	CategoryAutocomplete,
	FormTokenField,
	Grid,
	Modal,
	SelectControl,
	Settings,
	hooks,
} from '../../../../components/src';
import {
	frequenciesForPopup,
	isOverlay,
	placementsForPopups,
	overlaySizesForPopups,
} from '../../utils';

const { SettingsCard } = Settings;

const PromptSettingsModal = ( { prompt, disabled, onClose, segments, updatePopup } ) => {
	const [ promptConfig, setPromptConfig ] = hooks.useObjectState( prompt );
	const { excluded_categories: excludedCategories = [], excluded_tags: excludedTags = [] } =
		promptConfig.options || {};
	const [ showAdvanced, setShowAdvanced ] = useState(
		0 < excludedCategories.length || 0 < excludedTags.length || false
	);

	const handleSave = () => {
		updatePopup( promptConfig ).then( onClose );
	};

	const assignedSegmentsIds = ( promptConfig.options.selected_segment_id || '' ).split( ',' );

	return (
		<Modal title={ prompt.title } onRequestClose={ onClose } isWide>
			<Button onClick={ () => onClose() } className="screen-reader-text">
				{ __( 'Close Modal', 'newspack' ) }
			</Button>
			<Grid gutter={ 64 } columns={ 1 }>
				<SettingsCard
					title={ __( 'Campaigns', 'newspack' ) }
					description={ __(
						'Assign a prompt to one or more campaigns for easier management',
						'newspack'
					) }
					columns={ 1 }
					className="newspack-settings__campaigns"
					noBorder
				>
					<CategoryAutocomplete
						disabled={ disabled }
						value={ promptConfig.campaign_groups || [] }
						onChange={ tokens => setPromptConfig( { campaign_groups: tokens } ) }
						label={ __( 'Campaigns', 'newspack' ) }
						taxonomy="newspack_popups_taxonomy"
						hideLabelFromVision
					/>
				</SettingsCard>

				<SettingsCard
					title={ __( 'Settings', 'newspack' ) }
					description={ __( 'When and how should the prompt be displayed', 'newspack' ) }
					columns={ isOverlay( prompt ) ? 3 : 2 }
					className="newspack-settings__settings"
					rowGap={ 16 }
					noBorder
				>
					<SelectControl
						label={ __( 'Frequency', 'newspack' ) }
						disabled={ disabled }
						onChange={ value => {
							setPromptConfig( { options: { frequency: value } } );
						} }
						options={ frequenciesForPopup( prompt ) }
						value={ promptConfig.options.frequency }
					/>
					<SelectControl
						label={ isOverlay( prompt ) ? __( 'Position' ) : __( 'Placement' ) }
						disabled={ disabled }
						onChange={ value => {
							setPromptConfig( { options: { placement: value } } );
						} }
						options={ placementsForPopups( prompt ) }
						value={ promptConfig.options.placement }
					/>
					{ isOverlay( prompt ) && (
						<SelectControl
							label={ __( 'Size' ) }
							disabled={ disabled }
							onChange={ value => {
								setPromptConfig( { options: { overlay_size: value } } );
							} }
							options={ overlaySizesForPopups( prompt ) }
							value={ promptConfig.options.overlay_size }
						/>
					) }
				</SettingsCard>

				<SettingsCard
					title={ __( 'Targeting', 'newspack' ) }
					description={ () => (
						<>
							{ __( 'Under which conditions should the prompt be displayed', 'newspack' ) }
							<br />
							{ __(
								'If multiple conditions are set, all will have to be satisfied in order to display the prompt',
								'newspack'
							) }
						</>
					) }
					className="newspack-settings__targeting"
					columns={ 1 }
					rowGap={ 16 }
					noBorder
				>
					<Grid columns={ 3 } rowGap={ 16 }>
						<FormTokenField
							label={ __( 'Segment', 'newspack' ) }
							disabled={ disabled }
							hideHelpFromVision
							value={ segments
								.filter( ( { id } ) => assignedSegmentsIds.indexOf( id ) > -1 )
								.map( segment => segment.name ) }
							onChange={ _segments => {
								const segmentsToAssign = segments
									.filter( segment => -1 < _segments.indexOf( segment.name ) )
									.map( segment => segment.id );
								setPromptConfig( {
									options: { selected_segment_id: segmentsToAssign.join( ',' ) },
								} );
							} }
							suggestions={ segments
								.filter( segment => -1 === assignedSegmentsIds.indexOf( segment.id ) )
								.map( segment => segment.name ) }
							description={ __(
								'Prompt will only appear to reader belonging to the specified segments.',
								'newspack'
							) }
						/>
						<CategoryAutocomplete
							label={ __( 'Post categories', 'newspack ' ) }
							disabled={ disabled }
							hideHelpFromVision
							value={ promptConfig.categories || [] }
							onChange={ tokens => setPromptConfig( { categories: tokens } ) }
							description={ __(
								'Prompt will only appear on posts with the specified categories.',
								'newspack'
							) }
						/>
						<CategoryAutocomplete
							label={ __( 'Post tags', 'newspack ' ) }
							disabled={ disabled }
							hideHelpFromVision
							taxonomy="tags"
							value={ promptConfig.tags || [] }
							onChange={ tokens => setPromptConfig( { tags: tokens } ) }
							description={ __(
								'Prompt will only appear on posts with the specified tags.',
								'newspack'
							) }
						/>
					</Grid>
					<div>
						<Button isLink onClick={ () => setShowAdvanced( ! showAdvanced ) }>
							{ sprintf(
								// Translators: whether to show or hide advanced settings fields.
								__( '%s Advanced Settings', 'newspack_popups_taxonomy' ),
								showAdvanced ? __( 'Hide', 'newspack' ) : __( 'Show', 'newspack' )
							) }
						</Button>
					</div>
					{ showAdvanced && (
						<Grid columns={ 3 } rowGap={ 16 }>
							<CategoryAutocomplete
								label={ __( 'Category Exclusions', 'newspack ' ) }
								disabled={ disabled }
								hideHelpFromVision
								value={ excludedCategories || [] }
								onChange={ tokens =>
									setPromptConfig( {
										options: {
											excluded_categories: tokens.map( token => token.id ),
										},
									} )
								}
								description={ __(
									'Prompt will not appear on posts with the specified categories.',
									'newspack'
								) }
							/>
							<CategoryAutocomplete
								label={ __( 'Tag Exclusions', 'newspack ' ) }
								disabled={ disabled }
								hideHelpFromVision
								taxonomy="tags"
								value={ excludedTags || [] }
								onChange={ tokens =>
									setPromptConfig( {
										options: {
											excluded_tags: tokens.map( token => token.id ),
										},
									} )
								}
								description={ __(
									'Prompt will not appear on posts with the specified tags.',
									'newspack'
								) }
							/>
						</Grid>
					) }
				</SettingsCard>
			</Grid>

			<Card buttonsCard noBorder className="justify-end">
				<Button onClick={ onClose } variant="secondary">
					{ __( 'Cancel', 'newspack' ) }
				</Button>
				<Button onClick={ handleSave } variant="primary">
					{ __( 'Save', 'newspack' ) }
				</Button>
			</Card>
		</Modal>
	);
};
export default PromptSettingsModal;
