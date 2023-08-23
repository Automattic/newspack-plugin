/**
 * WordPress dependencies.
 */
import { ToggleControl } from '@wordpress/components';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import find from 'lodash/find';
import { applyFilters, addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies.
 */
import {
	Button,
	CategoryAutocomplete,
	Router,
	SelectControl,
	Settings,
	TextControl,
	hooks,
} from '../../../../components/src';

const { useHistory } = Router;
const { SettingsCard, SettingsSection, MinMaxSetting } = Settings;

const DEFAULT_CONFIG = {
	is_disabled: false,
};

const SingleSegment = ( { segmentId, setSegments, wizardApiFetch } ) => {
	const allCriteria = window.newspack_popups_wizard_data?.criteria || [];

	const [ segmentConfig, updateSegmentConfig ] = hooks.useObjectState( DEFAULT_CONFIG );
	const [ name, setName ] = useState( '' );
	const [ segmentCriteria, setSegmentCriteria ] = useState( [] );
	const [ segmentCriteriaInitially, setSegmentCriteriaInitially ] = useState( [] );
	const [ nameInitially, setNameInitially ] = useState( '' );
	const history = useHistory();

	const [ segmentInitially, setSegmentInitially ] = useState( '[]' );

	const isSegmentValid = () => {
		const _segmentConfig = { ...segmentConfig };
		const _defaultConfig = { ...DEFAULT_CONFIG };
		delete _segmentConfig.is_disabled;
		delete _defaultConfig.is_disabled;
		return name.length > 0 && segmentCriteria.length; // Segment has a name. // Segment has criteria.
	};

	const isDirty =
		segmentCriteriaInitially !== JSON.stringify( segmentCriteria ) ||
		nameInitially !== name ||
		JSON.stringify( segmentInitially.is_disabled ) !== JSON.stringify( segmentConfig.is_disabled );

	const unblock = hooks.usePrompt(
		isDirty,
		__( 'There are unsaved changes to this segment. Discard changes?', 'newspack' )
	);

	const isNew = segmentId === 'new';
	useEffect( () => {
		if ( ! isNew ) {
			wizardApiFetch( {
				path: `/newspack/v1/wizard/newspack-popups-wizard/segmentation`,
			} ).then( segments => {
				const foundSegment = find( segments, ( { id } ) => id === segmentId );
				if ( foundSegment ) {
					const segmentConfigurationWithDefaults = {
						...DEFAULT_CONFIG,
						...foundSegment.configuration,
					};
					updateSegmentConfig( segmentConfigurationWithDefaults );
					setSegmentInitially( segmentConfigurationWithDefaults );
					setName( foundSegment.name );
					setNameInitially( foundSegment.name );
					setSegmentCriteria( [ ...foundSegment.criteria ] );
					setSegmentCriteriaInitially( JSON.stringify( foundSegment.criteria ) );
				}
			} );
		}
	}, [ isNew ] );

	const saveSegment = () => {
		unblock();

		const path = isNew
			? `/newspack/v1/wizard/newspack-popups-wizard/segmentation`
			: `/newspack/v1/wizard/newspack-popups-wizard/segmentation/${ segmentId }`;
		wizardApiFetch( {
			path,
			method: 'POST',
			data: {
				name,
				criteria: segmentCriteria,
				configuration: segmentConfig,
			},
		} )
			.then( setSegments )
			.then( history.push( '/segments' ) );
	};

	const getCriteriaValue = id => {
		const item = segmentCriteria.find( c => c.criteria_id === id );
		if ( ! item ) {
			return '';
		}
		return item.value;
	};

	const updateCriteria = id => value => {
		const config = [ ...segmentCriteria ];
		const item = config.find( c => c.criteria_id === id );
		if ( item ) {
			if ( ! value ) {
				config.splice( config.indexOf( item ), 1 );
			} else if ( ! Array.isArray( value ) && typeof value === 'object' ) {
				item.value = { ...item.value, ...value };
			} else {
				item.value = value;
			}
		} else if ( value ) {
			config.push( { criteria_id: id, value } );
		}
		setSegmentCriteria( config );
	};

	const getCriteriaInput = criteria => {
		const value = getCriteriaValue( criteria.id );
		const update = updateCriteria( criteria.id );
		const getInput = () => {
			if ( criteria.matching_function === 'range' ) {
				return (
					<MinMaxSetting
						data-testid={ `newspack-criteria-${ criteria.id }` }
						min={ value?.min }
						max={ value?.max }
						onChangeMin={ min => update( { min } ) }
						onChangeMax={ max => update( { max } ) }
					/>
				);
			}
			if ( criteria.options?.length ) {
				return (
					<SelectControl
						data-testid={ `newspack-criteria-${ criteria.id }` }
						isWide
						onChange={ update }
						value={ value }
						options={ criteria.options }
					/>
				);
			}
			return (
				<TextControl
					data-testid={ `newspack-criteria-${ criteria.id }` }
					isWide
					placeholder={ criteria.placeholder }
					help={ criteria.help }
					value={ value }
					onChange={ update }
				/>
			);
		};
		return applyFilters( 'newspack.criteria.input', getInput(), criteria, value, update );
	};

	return (
		<Fragment>
			<TextControl
				placeholder={ __( 'Untitled Segment', 'newspack' ) }
				value={ name }
				onChange={ setName }
				label={ __( 'Title', 'newspack' ) }
				className={ 'newspack-campaigns-wizard-segments__title' }
			/>

			<SettingsCard
				title={ __( 'Segment Status', 'newspack' ) }
				description={ __(
					'If not enabled, the segment will be ignored for reader segmentation.',
					'newspack'
				) }
				noBorder
			>
				<ToggleControl
					label={ __( 'Segment enabled', 'newspack' ) }
					checked={ ! segmentConfig.is_disabled }
					onChange={ () => updateSegmentConfig( { is_disabled: ! segmentConfig.is_disabled } ) }
				/>
			</SettingsCard>

			<SettingsCard
				title={ __( 'Reader Engagement', 'newspack' ) }
				description={ __( 'Target readers based on their browsing behavior', 'newspack' ) }
				noBorder
			>
				{ allCriteria
					.filter( criteria => criteria.category === 'reader_engagement' )
					.map( criteria => (
						<SettingsSection
							key={ criteria.id }
							title={ criteria.name }
							description={ criteria.description }
						>
							{ getCriteriaInput( criteria ) }
						</SettingsSection>
					) ) }
			</SettingsCard>
			<SettingsCard
				title={ __( 'Reader Activity', 'newspack' ) }
				description={ __( 'Target readers based on their actions', 'newspack' ) }
				columns={ 3 }
				noBorder
			>
				{ allCriteria
					.filter( criteria => criteria.category === 'reader_activity' )
					.map( criteria => (
						<SettingsSection
							key={ criteria.id }
							title={ criteria.name }
							description={ criteria.description }
						>
							{ getCriteriaInput( criteria ) }
						</SettingsSection>
					) ) }
			</SettingsCard>
			<SettingsCard
				title={ __( 'Referrer Sources', 'newspack' ) }
				description={ __( 'Target readers based on where they’re coming from', 'newspack' ) }
				notification={ __(
					'Segments using these options will apply only to the first page visited after coming from an external source.',
					'newspack'
				) }
				columns={ 2 }
				noBorder
			>
				{ allCriteria
					.filter( criteria => criteria.category === 'referrer_sources' )
					.map( criteria => (
						<SettingsSection
							key={ criteria.id }
							title={ criteria.name }
							description={ criteria.description }
						>
							{ getCriteriaInput( criteria ) }
						</SettingsSection>
					) ) }
			</SettingsCard>
			<div className="newspack-buttons-card">
				<Button
					disabled={ ! isSegmentValid() || ( ! isNew && ! isDirty ) }
					isPrimary
					onClick={ saveSegment }
				>
					{ __( 'Save', 'newspack' ) }
				</Button>
				<Button isSecondary href="#/segments">
					{ __( 'Cancel', 'newspack' ) }
				</Button>
			</div>
		</Fragment>
	);
};

/**
 * Adds a custom input for the favorite_categories criteria.
 */
addFilter(
	'newspack.criteria.input',
	'newspack.favoriteCategories',
	function ( element, criteria, value, update ) {
		if ( criteria.id === 'favorite_categories' ) {
			return (
				<CategoryAutocomplete
					value={ value || [] }
					onChange={ selected => {
						update( selected.map( item => item.id ) );
					} }
					label={ criteria.name }
					hideLabelFromVision
				/>
			);
		}
		return element;
	}
);

export default SingleSegment;
