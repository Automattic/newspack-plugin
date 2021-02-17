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
	Notice,
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

const DEFAULT_CRITERIA = {
	engagement: false,
	activity: false,
	referrers: false,
};

const SingleSegment = ( { segmentId, setSegments, wizardApiFetch } ) => {
	const [ segmentConfig, updateSegmentConfig ] = hooks.useObjectState( DEFAULT_CONFIG );
	const [ name, setName ] = useState( '' );
	const [ nameInitially, setNameInitially ] = useState( '' );
	const [ isFetchingReach, setIsFetchingReach ] = useState( false );
	const [ reach, setReach ] = useState( { total: 0, in_segment: 0 } );
	const [ criteria, setCriteria ] = useState( DEFAULT_CRITERIA );
	const history = useHistory();

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

	const isSegmentValid =
		name.length > 0 && // Segment has a name.
		JSON.stringify( getConfigToSave() ) !== JSON.stringify( DEFAULT_CONFIG ) && // Segment differs from the default config.
		( criteria.engagement || criteria.activity || criteria.referrers ); // At least one criteria section is enbaled.

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
					updateSegmentConfig( segmentConfigurationWithDefaults );
					setSegmentInitially( segmentConfigurationWithDefaults );
					setName( foundSegment.name );
					setNameInitially( foundSegment.name );
				}
			} );
		}
	}, [ isNew ] );

	const updateReach = useMemo( () => {
		return debounce(
			config => {
				setIsFetchingReach( true );
				apiFetch( {
					path: `/newspack/v1/wizard/newspack-popups-wizard/segmentation-reach?config=${ JSON.stringify(
						config
					) }`,
				} ).then( res => {
					setReach( res );
					setIsFetchingReach( false );
				} );
			},
			500,
			{ leading: true }
		);
	}, [] );

	const updateCriteria = () => {
		if ( ! segmentInitially ) {
			return;
		}

		// Automatically enable sections with options that differ from the default.
		const newCriteria = { ...criteria };
		if (
			segmentInitially.min_posts ||
			segmentInitially.max_posts ||
			segmentInitially.min_session_posts ||
			segmentInitially.max_session_posts ||
			( segmentInitially.favorite_categories && 0 < segmentInitially.favorite_categories.length )
		) {
			newCriteria.engagement = true;
			newCriteria.engagement = true;
		}

		if (
			segmentInitially.is_subscribed ||
			segmentInitially.is_not_subscribed ||
			segmentInitially.is_donor ||
			segmentInitially.is_not_donor
		) {
			newCriteria.activity = true;
			newCriteria.activity = true;
		}

		if ( segmentInitially.referrers || segmentInitially.referrers_not ) {
			newCriteria.referrers = true;
			newCriteria.referrers = true;
		}

		setCriteria( newCriteria );
	};

	useEffect( () => {
		updateReach( getConfigToSave() );
	}, [ JSON.stringify( criteria ), JSON.stringify( segmentConfig ) ] );

	useEffect( () => {
		updateCriteria();
	}, [ JSON.stringify( segmentInitially ) ] );

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
			<div className="newspack-campaigns-wizard-segments__header">
				<TextControl
					placeholder={ __( 'Untitled Segment', 'newspack' ) }
					value={ name }
					onChange={ setName }
					label={ __( 'Title', 'newspack' ) }
					hideLabelFromVision={ true }
				/>
				<div className="newspack-buttons-card">
					<Button
						disabled={ ! isSegmentValid || ( ! isNew && ! isDirty ) }
						isPrimary
						isSmall
						onClick={ saveSegment }
					>
						{ __( 'Save', 'newspack' ) }
					</Button>
					<Button isSecondary isSmall href="#/segments">
						{ __( 'Cancel', 'newspack' ) }
					</Button>
				</div>
			</div>
			{ reach.total > 0 && (
				<Notice
					isInfo
					className="newspack-campaigns-wizard-segments__recorded-visitors"
					style={ { opacity: isFetchingReach ? 0.5 : 1 } }
					noticeText={
						__( 'This segment would reach approximately ', 'newspack' ) +
						Math.round( ( reach.in_segment * 100 ) / reach.total ) +
						__( '% of recorded visitors.', 'newspack' )
					}
				/>
			) }
			<SegmentCriteria
				title={ __( 'Reader Engagement', 'newspack' ) }
				description={ __( 'Target readers based on their browsing behavior.', 'newspack' ) }
				toggleChecked={ criteria.engagement }
				toggleOnChange={ () => {
					const newCriteria = { ...criteria, engagement: ! criteria.engagement };
					setCriteria( newCriteria );
				} }
				notification={
					criteria.referrers
						? __(
								'Disable Referrer Sources in order to use Reader Engagement options.',
								'newspack'
						  )
						: null
				}
				disabled={ criteria.referrers }
			>
				<Grid columns="3" gutter={ 24 }>
					<SegmentSettingSection
						title={ __( 'Articles read', 'newspack' ) }
						description={ __( 'Number of articles read in the last 30 day period.', 'newspack' ) }
					>
						<div className="newspack-campaigns-wizard-segments__section__min-max">
							<CheckboxControl
								disabled={ criteria.referrers }
								checked={ segmentConfig.min_posts > 0 }
								onChange={ value => updateSegmentConfig( 'min_posts' )( value ? 1 : 0 ) }
								label={ __( 'Min.', 'newspack' ) }
							/>
							<TextControl
								disabled={ criteria.referrers }
								placeholder={ __( 'Min. posts', 'newspack' ) }
								type="number"
								value={ segmentConfig.min_posts }
								onChange={ value => updateSegmentConfig( 'min_posts' )( value > 0 ? value : 0 ) }
							/>
						</div>
						<div className="newspack-campaigns-wizard-segments__section__min-max">
							<CheckboxControl
								disabled={ criteria.referrers }
								checked={ segmentConfig.max_posts > 0 }
								onChange={ value =>
									updateSegmentConfig( 'max_posts' )( value ? segmentConfig.min_posts || 1 : 0 )
								}
								label={ __( 'Max.', 'newspack' ) }
							/>
							<TextControl
								disabled={ criteria.referrers }
								placeholder={ __( 'Max. posts', 'newspack' ) }
								type="number"
								value={ segmentConfig.max_posts }
								onChange={ value => updateSegmentConfig( 'max_posts' )( value > 0 ? value : 0 ) }
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
								disabled={ criteria.referrers }
								checked={ segmentConfig.min_session_posts > 0 }
								onChange={ value => updateSegmentConfig( 'min_session_posts' )( value ? 1 : 0 ) }
								label={ __( 'Min.', 'newspack' ) }
							/>
							<TextControl
								disabled={ criteria.referrers }
								placeholder={ __( 'Min. posts in sesssion', 'newspack' ) }
								type="number"
								value={ segmentConfig.min_session_posts }
								onChange={ value =>
									updateSegmentConfig( 'min_session_posts' )( value > 0 ? value : 0 )
								}
							/>
						</div>
						<div className="newspack-campaigns-wizard-segments__section__min-max">
							<CheckboxControl
								disabled={ criteria.referrers }
								checked={ segmentConfig.max_session_posts > 0 }
								onChange={ value =>
									updateSegmentConfig( 'max_session_posts' )(
										value ? segmentConfig.min_session_posts || 1 : 0
									)
								}
								label={ __( 'Max.', 'newspack' ) }
							/>
							<TextControl
								disabled={ criteria.referrers }
								placeholder={ __( 'Max. posts in sesssion', 'newspack' ) }
								type="number"
								value={ segmentConfig.max_session_posts }
								onChange={ value =>
									updateSegmentConfig( 'max_session_posts' )( value > 0 ? value : 0 )
								}
							/>
						</div>
					</SegmentSettingSection>
					<SegmentSettingSection
						title={ __( 'Favorite Categories', 'newspack' ) }
						description={ __( 'Most read categories of reader.', 'newspack' ) }
					>
						<CategoryAutocomplete
							disabled={ criteria.referrers }
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
				toggleOnChange={ () => {
					const newCriteria = { ...criteria, referrers: ! criteria.referrers };
					setCriteria( newCriteria );
				} }
				notification={
					criteria.engagement
						? __(
								'Disable Reader Engagement in order to use Referrer Sources options.',
								'newspack'
						  )
						: null
				}
				disabled={ criteria.engagement }
			>
				<Grid columns="3" gutter={ 24 }>
					<SegmentSettingSection
						title={ __( 'Sources to match', 'newspack' ) }
						description={ __( 'Segment based on traffic source.', 'newspack' ) }
					>
						<TextControl
							disabled={ criteria.engagement }
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
							disabled={ criteria.engagement }
							isWide
							placeholder={ __( 'twitter.com, instagram.com', 'newspack' ) }
							help={ __( 'A comma-separated list of domains.', 'newspack' ) }
							value={ segmentConfig.referrers_not }
							onChange={ updateSegmentConfig( 'referrers_not' ) }
						/>
					</SegmentSettingSection>
				</Grid>
			</SegmentCriteria>
		</Fragment>
	);
};

export default SingleSegment;
