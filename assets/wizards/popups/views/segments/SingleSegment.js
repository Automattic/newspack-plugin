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
	CategoryAutocomplete,
	Notice,
	SelectControl,
	Router,
	TextControl,
	Settings,
	hooks,
} from '../../../../components/src';

const { useHistory } = Router;
const { SettingsCard, SettingsSection, MinMaxSetting } = Settings;

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
	const [ segmentConfig, updateSegmentConfig ] = hooks.useObjectState( DEFAULT_CONFIG );
	const [ name, setName ] = useState( '' );
	const [ nameInitially, setNameInitially ] = useState( '' );
	const [ isFetchingReach, setIsFetchingReach ] = useState( false );
	const [ reach, setReach ] = useState( { total: 0, in_segment: 0 } );
	const history = useHistory();

	const [ segmentInitially, setSegmentInitially ] = useState( null );

	const isSegmentValid =
		name.length > 0 && JSON.stringify( segmentConfig ) !== JSON.stringify( DEFAULT_CONFIG ); // Segment has a name. // Segment differs from the default config.

	const isDirty =
		JSON.stringify( segmentInitially ) !== JSON.stringify( segmentConfig ) ||
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

	useEffect( () => {
		updateReach( segmentConfig );
	}, [ JSON.stringify( segmentConfig ) ] );

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
				configuration: segmentConfig,
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
			<SettingsCard
				title={ __( 'Reader Engagement', 'newspack' ) }
				description={ __( 'Target readers based on their browsing behavior.', 'newspack' ) }
			>
				<SettingsSection
					title={ __( 'Articles read', 'newspack' ) }
					description={ __( 'Number of articles read in the last 30 day period.', 'newspack' ) }
				>
					<MinMaxSetting
						min={ segmentConfig.min_posts }
						max={ segmentConfig.max_posts }
						onChangeMin={ updateSegmentConfig( 'min_posts' ) }
						onChangeMax={ updateSegmentConfig( 'max_posts' ) }
						minPlaceholder={ __( 'Min posts', 'newspack' ) }
						maxPlaceholder={ __( 'Max posts', 'newspack' ) }
					/>
				</SettingsSection>
				<SettingsSection
					title={ __( 'Articles read in session', 'newspack' ) }
					description={ __(
						'Number of articles read in the current session (45 minutes).',
						'newspack'
					) }
				>
					<MinMaxSetting
						min={ segmentConfig.min_session_posts }
						max={ segmentConfig.max_session_posts }
						onChangeMin={ updateSegmentConfig( 'min_session_posts' ) }
						minPlaceholder={ __( 'Min posts in session', 'newspack' ) }
						maxPlaceholder={ __( 'Max posts in session', 'newspack' ) }
					/>
				</SettingsSection>
				<SettingsSection
					title={ __( 'Favorite Categories', 'newspack' ) }
					description={ __( 'Most-read categories of reader.', 'newspack' ) }
				>
					<CategoryAutocomplete
						value={ segmentConfig.favorite_categories.map( v => parseInt( v ) ) }
						onChange={ selected => {
							updateSegmentConfig( 'favorite_categories' )( selected.map( item => item.id ) );
						} }
						label={ __( 'Favorite Categories', 'newspack ' ) }
					/>
				</SettingsSection>
			</SettingsCard>
			<SettingsCard
				title={ __( 'Reader Activity', 'newspack' ) }
				description={ __( 'Target readers based on their actions.', 'newspack' ) }
			>
				<SettingsSection title={ __( 'Newsletter', 'newspack' ) }>
					<SelectControl
						data-testid="subscriber-select"
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
				</SettingsSection>
				<SettingsSection
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
				</SettingsSection>
			</SettingsCard>
			<SettingsCard
				title={ __( 'Referrer Sources', 'newspack' ) }
				description={ __( 'Target readers based on where they’re coming from.', 'newspack' ) }
				notification={ __(
					'Segments using these options will apply only to the first page visited after coming from an external source.',
					'newspack'
				) }
			>
				<SettingsSection
					title={ __( 'Sources to match', 'newspack' ) }
					description={ __( 'Segment based on traffic source.', 'newspack' ) }
				>
					<TextControl
						data-testid="referrers-input"
						isWide
						placeholder={ __( 'google.com, facebook.com', 'newspack' ) }
						help={ __( 'A comma-separated list of domains.', 'newspack' ) }
						value={ segmentConfig.referrers }
						onChange={ updateSegmentConfig( 'referrers' ) }
					/>
				</SettingsSection>
				<SettingsSection
					title={ __( 'Sources to exclude', 'newspack' ) }
					description={ __(
						'Segment based on traffic source - hide campaigns for visitors coming from specific sources.',
						'newspack'
					) }
				>
					<TextControl
						isWide
						placeholder={ __( 'twitter.com, instagram.com', 'newspack' ) }
						help={ __( 'A comma-separated list of domains.', 'newspack' ) }
						value={ segmentConfig.referrers_not }
						onChange={ updateSegmentConfig( 'referrers_not' ) }
					/>
				</SettingsSection>
			</SettingsCard>
		</Fragment>
	);
};

export default SingleSegment;
