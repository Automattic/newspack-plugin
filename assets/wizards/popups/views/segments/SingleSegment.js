/**
 * WordPress dependencies.
 */
import { ToggleControl } from '@wordpress/components';
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
	Router,
	SelectControl,
	Settings,
	TextControl,
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
	is_not_subscribed: false,
	is_donor: false,
	is_not_donor: false,
	is_former_donor: false,
	is_logged_in: false,
	is_not_logged_in: false,
	favorite_categories: [],
	referrers: '',
	referrers_not: '',
	is_disabled: false,
};

const SingleSegment = ( { segmentId, setSegments, wizardApiFetch } ) => {
	const [ segmentConfig, updateSegmentConfig ] = hooks.useObjectState( DEFAULT_CONFIG );
	const [ name, setName ] = useState( '' );
	const [ nameInitially, setNameInitially ] = useState( '' );
	const [ isFetchingReach, setIsFetchingReach ] = useState( false );
	const [ reach, setReach ] = useState( { total: 0, in_segment: 0 } );
	const history = useHistory();

	const [ segmentInitially, setSegmentInitially ] = useState( null );

	const isSegmentValid = () => {
		const _segmentConfig = { ...segmentConfig };
		const _defaultConfig = { ...DEFAULT_CONFIG };
		delete _segmentConfig.is_disabled;
		delete _defaultConfig.is_disabled;
		return name.length > 0 && JSON.stringify( _segmentConfig ) !== JSON.stringify( _defaultConfig ); // Segment has a name. // Segment differs from the default config with the exception of the is_disabled flag.
	};

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
			<TextControl
				placeholder={ __( 'Untitled Segment', 'newspack' ) }
				value={ name }
				onChange={ setName }
				label={ __( 'Title', 'newspack' ) }
				className={ 'newspack-campaigns-wizard-segments__title' }
			/>

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
						onChangeMax={ updateSegmentConfig( 'max_session_posts' ) }
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
						hideLabelFromVision
					/>
				</SettingsSection>
			</SettingsCard>
			<SettingsCard
				title={ __( 'Reader Activity', 'newspack' ) }
				description={ __( 'Target readers based on their actions', 'newspack' ) }
				columns={ 3 }
				noBorder
			>
				<SettingsSection title={ __( 'Newsletter', 'newspack' ) }>
					<SelectControl
						isWide
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
					description={ __( '(if the checkout happens on-site)', 'newspack' ) }
				>
					<SelectControl
						isWide
						onChange={ value => {
							value = parseInt( value );
							updateSegmentConfig( {
								is_donor: value === 1,
								is_not_donor: value === 2,
								is_former_donor: value === 3,
							} );
						} }
						value={ [
							false,
							segmentConfig.is_donor,
							segmentConfig.is_not_donor,
							segmentConfig.is_former_donor,
						].reduce(
							( defaultValue, configValue, index ) => ( configValue ? index : defaultValue ),
							0
						) }
						options={ [
							{ value: 0, label: __( 'Donors and non-donors', 'newspack' ) },
							{ value: 1, label: __( 'Donors', 'newspack' ) },
							{ value: 2, label: __( 'Non-donors', 'newspack' ) },
							{
								value: 3,
								label: __( 'Former donors (who cancelled a recurring donation)', 'newspack' ),
							},
						] }
					/>
				</SettingsSection>
				<SettingsSection title={ __( 'User Account', 'newspack' ) }>
					<SelectControl
						isWide
						onChange={ value => {
							value = parseInt( value );
							if ( value === 0 ) {
								updateSegmentConfig( {
									is_logged_in: false,
									is_not_logged_in: false,
								} );
							} else {
								updateSegmentConfig( {
									is_logged_in: value === 1,
									is_not_logged_in: value === 2,
								} );
							}
						} }
						// eslint-disable-next-line no-nested-ternary
						value={ segmentConfig.is_logged_in ? 1 : segmentConfig.is_not_logged_in ? 2 : 0 }
						options={ [
							{ value: 0, label: __( 'All users', 'newspack' ) },
							{ value: 1, label: __( 'Has user account', 'newspack' ) },
							{ value: 2, label: __( 'Does not have user account', 'newspack' ) },
						] }
					/>
				</SettingsSection>
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
				<SettingsSection
					title={ __( 'Sources to match', 'newspack' ) }
					description={ __( 'Segment based on traffic source.', 'newspack' ) }
				>
					<TextControl
						isWide
						data-testid="referrers-input"
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

export default SingleSegment;
