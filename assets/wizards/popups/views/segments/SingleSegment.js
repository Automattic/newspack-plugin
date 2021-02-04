/**
 * WordPress dependencies.
 */
import { useMemo, useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { find, debounce } from 'lodash';

/**
 * Internal dependencies.
 */
import {
	Button,
	Card,
	CategoryAutocomplete,
	CheckboxControl,
	SelectControl,
	Grid,
	InfoButton,
	Router,
	TextControl,
	hooks,
} from '../../../../components/src';
import SegmentCriteria from '../../components/segment-criteria';

const { useHistory } = Router;

const SegmentSettingSection = ( { title, description, children } ) => (
	<Card isSmall noBorder className="newspack-campaigns-wizard-segments__section">
		<div className="newspack-campaigns-wizard-segments__section__title">
			<h3>{ title }</h3>
			{ description && <InfoButton text={ description } /> }
		</div>
		<div className="newspack-campaigns-wizard-segments__section__content">{ children }</div>
	</Card>
);

const DEFAULT_CONFIG = {
	min_posts: 0,
	max_posts: 0,
	min_session_posts: 0,
	max_session_posts: 0,
	is_subscribed: false,
	is_donor: false,
	is_not_subscribed: false,
	is_not_donor: false,
	favorite_categories: [],
	referrers: '',
	referrers_not: '',
};

const SingleSegment = ( { segmentId, setSegments, wizardApiFetch } ) => {
	const [ segmentConfig, setSegmentConfig ] = useState( DEFAULT_CONFIG );
	const updateSegmentConfig = keyOrPartialUpdate => {
		if ( typeof keyOrPartialUpdate === 'string' ) {
			return value => setSegmentConfig( { ...segmentConfig, [ keyOrPartialUpdate ]: value } );
		}
		return setSegmentConfig( { ...segmentConfig, ...keyOrPartialUpdate } );
	};
	const [ name, setName ] = useState( '' );
	const [ nameInitially, setNameInitially ] = useState( '' );
	const [ isFetchingReach, setIsFetchingReach ] = useState( { total: 0, in_segment: 0 } );
	const [ reach, setReach ] = useState( { total: 0, in_segment: 0 } );
	const [ criteria, setCriteria ] = useState( {
		engagement: false,
		activity: false,
		referrers: false,
	} );
	const history = useHistory();

	const isSegmentValid =
		name.length > 0 && // Segment has a name.
		JSON.stringify( segmentConfig ) !== JSON.stringify( DEFAULT_CONFIG ) && // Segment differs from the default config.
		( criteria.engagement || criteria.activity || criteria.referrers ); // At least one criteria section is enbaled.

	const [ segmentInitially, setSegmentInitially ] = useState( null );
	const getConfigToSave = () => {
		const configToSave = { ...segmentConfig };

		// If any criteria sections are disabled, reset their options to default.
		if ( ! criteria.engagement ) {
			configToSave.max_posts = 0;
			configToSave.max_session_posts = 0;
			configToSave.min_posts = 0;
			configToSave.min_session_posts = 0;
		}
		if ( ! criteria.activity ) {
			configToSave.is_donor = false;
			configToSave.is_not_donor = false;
			configToSave.is_not_subscribed = false;
			configToSave.is_subscribed = false;
		}
		if ( ! criteria.referrers ) {
			configToSave.referrers = '';
			configToSave.referrers_not = '';
		}

		return configToSave;
	};

	const isDirty =
		JSON.stringify( segmentInitially ) !== JSON.stringify( getConfigToSave() ) ||
		nameInitially !== name;

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
					setSegmentConfig( segmentConfigurationWithDefaults );
					setSegmentInitially( segmentConfigurationWithDefaults );
					setName( foundSegment.name );
					setNameInitially( foundSegment.name );
				}
			} );
		}
	}, [ isNew ] );

	const updateReach = useMemo( () => {
		return debounce( config => {
			setIsFetchingReach( true );
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-popups-wizard/segmentation-reach?config=${ JSON.stringify(
					config
				) }`,
			} ).then( res => {
				setReach( res );
				setIsFetchingReach( false );
			} );
		}, 500 );
	}, [] );

	useEffect( () => {
		// Automatically enable sections with options that differ from the default.
		const newCriteria = { ...criteria };
		if (
			segmentConfig.min_posts ||
			segmentConfig.max_posts ||
			segmentConfig.min_session_posts ||
			segmentConfig.max_session_posts ||
			( segmentConfig.favorite_categories && 0 < segmentConfig.favorite_categories.length )
		) {
			newCriteria.engagement = true;
		}

		if (
			segmentConfig.is_subscribed ||
			segmentConfig.is_not_subscribed ||
			segmentConfig.is_donor ||
			segmentConfig.is_not_donor
		) {
			newCriteria.activity = true;
		}

		if ( segmentConfig.referrers || segmentConfig.referrers_not ) {
			newCriteria.referrers = true;
		}

		setCriteria( newCriteria );
		updateReach( segmentConfig );
	}, [ JSON.stringify( segmentConfig ) ] );

	const saveSegment = () => {
		const configToSave = getConfigToSave();

		unblock();

		const path = isNew
			? `/newspack/v1/wizard/newspack-popups-wizard/segmentation`
			: `/newspack/v1/wizard/newspack-popups-wizard/segmentation/${ segmentId }`;
		wizardApiFetch( {
			path,
			method: 'POST',
			data: {
				name,
				configuration: configToSave,
			},
		} )
			.then( setSegments )
			.then( history.push( '/segments' ) );
	};

	return (
		<Fragment>
			<TextControl
				placeholder={ __( 'Untitled Segment', 'newspack' ) }
				value={ name }
				onChange={ setName }
				label={ __( 'Title', 'newspack' ) }
				hideLabelFromVision={ true }
			/>
			<SegmentCriteria
				title={ __( 'Reader Engagement', 'newspack' ) }
				description={ __( 'Target readers based on their browsing behavior.', 'newspack' ) }
				toggleChecked={ criteria.engagement }
				toggleOnChange={ enabled => {
					const newCriteria = { ...criteria, engagement: ! criteria.engagement };

					if ( enabled && criteria.referrers ) {
						newCriteria.referrers = false;
					}

					setCriteria( newCriteria );
				} }
			>
				<Grid columns="3" gutter={ 24 }>
					<SegmentSettingSection
						title={ __( 'Articles read', 'newspack' ) }
						description={ __( 'Number of articles read in the last 30 day period.', 'newspack' ) }
					>
						<div className="newspack-campaigns-wizard-segments__section__min-max">
							<CheckboxControl
								checked={ segmentConfig.min_posts > 0 }
								onChange={ value => {
									const newValue =
										segmentConfig.max_posts && value > segmentConfig.max_posts
											? segmentConfig.max_posts
											: 1;
									updateSegmentConfig( 'min_posts' )( value ? newValue : 0 );
								} }
								label={ __( 'Min.', 'newspack' ) }
							/>
							<TextControl
								placeholder={ __( 'Min. posts', 'newspack' ) }
								type="number"
								value={ segmentConfig.min_posts }
								onChange={ value => {
									const newValue =
										segmentConfig.max_posts && value > segmentConfig.max_posts
											? segmentConfig.max_posts
											: value;
									updateSegmentConfig( 'min_posts' )( newValue );
								} }
							/>
						</div>
						<div className="newspack-campaigns-wizard-segments__section__min-max">
							<CheckboxControl
								checked={ segmentConfig.max_posts > 0 }
								onChange={ value => {
									const newValue =
										segmentConfig.min_posts && value < segmentConfig.min_posts
											? segmentConfig.min_posts
											: 1;
									updateSegmentConfig( 'max_posts' )( value ? newValue : 0 );
								} }
								label={ __( 'Max.', 'newspack' ) }
							/>
							<TextControl
								placeholder={ __( 'Max. posts', 'newspack' ) }
								type="number"
								value={ segmentConfig.max_posts }
								onChange={ value => {
									const newValue =
										segmentConfig.min_posts && value < segmentConfig.min_posts
											? segmentConfig.min_posts
											: value;
									updateSegmentConfig( 'max_posts' )( newValue );
								} }
							/>
						</div>
					</SegmentSettingSection>
					<SegmentSettingSection
						title={ __( 'Articles read in session', 'newspack' ) }
						description={ __(
							'Number of articles read in the current session (45 minutes).',
							'newspack'
						) }
					>
						<div className="newspack-campaigns-wizard-segments__section__min-max">
							<CheckboxControl
								checked={ segmentConfig.min_session_posts > 0 }
								onChange={ value => {
									const newValue =
										segmentConfig.max_session_posts && value > segmentConfig.max_session_posts
											? segmentConfig.max_session_posts
											: 1;
									updateSegmentConfig( 'min_session_posts' )( value ? newValue : 0 );
								} }
								label={ __( 'Min.', 'newspack' ) }
							/>
							<TextControl
								placeholder={ __( 'Min. posts', 'newspack' ) }
								type="number"
								value={ segmentConfig.min_session_posts }
								onChange={ value => {
									const newValue =
										segmentConfig.max_session_posts && value > segmentConfig.max_session_posts
											? segmentConfig.max_session_posts
											: value;
									updateSegmentConfig( 'min_session_posts' )( newValue );
								} }
							/>
						</div>
						<div className="newspack-campaigns-wizard-segments__section__min-max">
							<CheckboxControl
								checked={ segmentConfig.max_session_posts > 0 }
								onChange={ value => {
									const newValue =
										segmentConfig.min_session_posts && value < segmentConfig.min_session_posts
											? segmentConfig.min_session_posts
											: 1;
									updateSegmentConfig( 'max_session_posts' )( value ? newValue : 0 );
								} }
								label={ __( 'Max.', 'newspack' ) }
							/>
							<TextControl
								placeholder={ __( 'Max. posts', 'newspack' ) }
								type="number"
								value={ segmentConfig.max_session_posts }
								onChange={ value => {
									const newValue =
										segmentConfig.min_session_posts && value < segmentConfig.min_session_posts
											? segmentConfig.min_session_posts
											: value;
									updateSegmentConfig( 'max_session_posts' )( newValue );
								} }
							/>
						</div>
					</SegmentSettingSection>
					<SegmentSettingSection
						title={ __( 'Favorite Categories', 'newspack' ) }
						description={ __( 'Most read categories of reader.', 'newspack' ) }
					>
						<CategoryAutocomplete
							value={ segmentConfig.favorite_categories.map( v => parseInt( v ) ) }
							onChange={ selected => {
								updateSegmentConfig( 'favorite_categories' )( selected.map( item => item.id ) );
							} }
							label={ __( 'Favorite Categories', 'newspack ' ) }
						/>
					</SegmentSettingSection>
				</Grid>
			</SegmentCriteria>
			<SegmentCriteria
				title={ __( 'Reader Activity', 'newspack' ) }
				description={ __( 'Target readers based on their actions.', 'newspack' ) }
				toggleChecked={ criteria.activity }
				toggleOnChange={ () => setCriteria( { ...criteria, activity: ! criteria.activity } ) }
			>
				<Grid columns="3" gutter={ 24 }>
					<SegmentSettingSection title={ __( 'Newsletter', 'newspack' ) }>
						<SelectControl
							onChange={ value => {
								value = parseInt( value );
								if ( value === 0 ) {
									updateSegmentConfig( {
										is_subscribed: false,
										is_not_subscribed: false,
									} );
								} else {
									updateSegmentConfig( {
										is_subscribed: value === 1,
										is_not_subscribed: value === 2,
									} );
								}
							} }
							// eslint-disable-next-line no-nested-ternary
							value={ segmentConfig.is_subscribed ? 1 : segmentConfig.is_not_subscribed ? 2 : 0 }
							options={ [
								{ value: 0, label: __( 'Subscribers and non-subscribers', 'newspack' ) },
								{ value: 1, label: __( 'Subscribers', 'newspack' ) },
								{ value: 2, label: __( 'Non-subscribers', 'newspack' ) },
							] }
						/>
					</SegmentSettingSection>
					<SegmentSettingSection
						title={ __( 'Donation', 'newspack' ) }
						description={ __( '(if using WooCommerce checkout)', 'newspack' ) }
					>
						<SelectControl
							onChange={ value => {
								value = parseInt( value );
								if ( value === 0 ) {
									updateSegmentConfig( {
										is_donor: false,
										is_not_donor: false,
									} );
								} else {
									updateSegmentConfig( {
										is_donor: value === 1,
										is_not_donor: value === 2,
									} );
								}
							} }
							// eslint-disable-next-line no-nested-ternary
							value={ segmentConfig.is_donor ? 1 : segmentConfig.is_not_donor ? 2 : 0 }
							options={ [
								{ value: 0, label: __( 'Donors and non-donors', 'newspack' ) },
								{ value: 1, label: __( 'Donors', 'newspack' ) },
								{ value: 2, label: __( 'Non-donors', 'newspack' ) },
							] }
						/>
					</SegmentSettingSection>
				</Grid>
			</SegmentCriteria>
			<SegmentCriteria
				title={ __( 'Referrer Sources', 'newspack' ) }
				description={ __( 'Target readers based on where they’re coming from.', 'newspack' ) }
				toggleChecked={ criteria.referrers }
				toggleOnChange={ enabled => {
					const newCriteria = { ...criteria, referrers: ! criteria.referrers };

					if ( enabled && criteria.engagement ) {
						newCriteria.engagement = false;
					}

					setCriteria( newCriteria );
				} }
			>
				<Grid columns="3" gutter={ 24 }>
					<SegmentSettingSection
						title={ __( 'Sources to match', 'newspack' ) }
						description={ __( 'Segment based on traffic source.', 'newspack' ) }
					>
						<TextControl
							isWide
							placeholder={ __( 'google.com, facebook.com', 'newspack' ) }
							help={ __( 'A comma-separated list of domains.', 'newspack' ) }
							value={ segmentConfig.referrers }
							onChange={ updateSegmentConfig( 'referrers' ) }
						/>
					</SegmentSettingSection>
					<SegmentSettingSection
						title={ __( 'Sources to exclude', 'newspack' ) }
						description={ __(
							'Segment based on traffic source - hide campaigns for visitors coming from specific sources.',
							'newspack'
						) }
					>
						<TextControl
							isWide
							placeholder={ __( 'google.com, facebook.com', 'newspack' ) }
							help={ __( 'A comma-separated list of domains.', 'newspack' ) }
							value={ segmentConfig.referrers_not }
							onChange={ updateSegmentConfig( 'referrers_not' ) }
						/>
					</SegmentSettingSection>
				</Grid>
			</SegmentCriteria>

			<div className="newspack-buttons-card">
				{ reach.total > 0 && (
					<p
						className="newspack-campaigns-wizard-segments__recorded-visitors"
						style={ { opacity: isFetchingReach ? 0.5 : 1 } }
					>
						{ __( 'This segment would reach approximately ', 'newspack' ) }
						<strong>
							{ Math.round( ( reach.in_segment * 100 ) / reach.total ) }
							{ '%' }
						</strong>
						{ __( ' of recorded visitors.', 'newspack' ) }
					</p>
				) }
				<Button
					disabled={ ! isSegmentValid || ( ! isNew && ! isDirty ) }
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

export default SingleSegment;
