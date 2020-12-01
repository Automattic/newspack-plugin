/**
 * WordPress dependencies.
 */
import { useMemo, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { find, debounce } from 'lodash';

/**
 * Internal dependencies.
 */
import {
	Button,
	CategoryAutocomplete,
	TextControl,
	CheckboxControl,
	Router,
} from '../../../../components/src';

const { NavLink, useHistory } = Router;

const SegmentSettingSection = ( { title, description, children } ) => (
	<div className="newspack-campaigns-wizard-segments__section">
		<h3>{ title }</h3>
		{ description && (
			<div className="newspack-campaigns-wizard-segments__section__description">
				{ description }
			</div>
		) }
		<div className="newspack-campaigns-wizard-segments__section__content">{ children }</div>
	</div>
);

const DEFAULT_CONFIG = {
	min_posts: 0,
	max_posts: 0,
	is_subscribed: false,
	is_donor: false,
	is_not_subscribed: false,
	is_not_donor: false,
	favorite_categories: [],
};

const SegmentsList = ( { segmentId, wizardApiFetch } ) => {
	const [ segmentConfig, setSegmentConfig ] = useState( DEFAULT_CONFIG );
	const updateSegmentConfig = key => value =>
		setSegmentConfig( { ...segmentConfig, [ key ]: value } );
	const [ name, setName ] = useState( '' );
	const [ isFetchingReach, setIsFetchingReach ] = useState( { total: 0, in_segment: 0 } );
	const [ reach, setReach ] = useState( { total: 0, in_segment: 0 } );
	const history = useHistory();

	const isSegmentValid = name.length > 0;

	const isNew = segmentId === 'new';
	useEffect( () => {
		if ( ! isNew ) {
			wizardApiFetch( {
				path: `/newspack/v1/wizard/newspack-popups-wizard/segmentation`,
			} ).then( segments => {
				const foundSegment = find( segments, ( { id } ) => id === segmentId );
				if ( foundSegment ) {
					setSegmentConfig( { ...DEFAULT_CONFIG, ...foundSegment.configuration } );
					setName( foundSegment.name );
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
		updateReach( segmentConfig );
	}, [ JSON.stringify( segmentConfig ) ] );

	const saveSegment = () => {
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
		} ).then( () => history.push( '/segmentation' ) );
	};

	return (
		<div>
			<TextControl
				placeholder={ __( 'Untitled Segment', 'newspack' ) }
				value={ name }
				onChange={ setName }
			/>
			<div className="newspack-campaigns-wizard-segments__sections-wrapper">
				<SegmentSettingSection title={ __( 'Number of articles read', 'newspack' ) }>
					<div>
						<CheckboxControl
							checked={ segmentConfig.min_posts > 0 }
							onChange={ value => updateSegmentConfig( 'min_posts' )( value ? 1 : 0 ) }
							label={ __( 'Min.', 'newspack' ) }
						/>
						<TextControl
							placeholder={ __( 'Min. posts', 'newspack' ) }
							type="number"
							value={ segmentConfig.min_posts }
							onChange={ updateSegmentConfig( 'min_posts' ) }
						/>
					</div>
					<div>
						<CheckboxControl
							checked={ segmentConfig.max_posts > 0 }
							onChange={ value => updateSegmentConfig( 'max_posts' )( value ? 1 : 0 ) }
							label={ __( 'Max.', 'newspack' ) }
						/>
						<TextControl
							placeholder={ __( 'Max. posts', 'newspack' ) }
							type="number"
							value={ segmentConfig.max_posts }
							onChange={ updateSegmentConfig( 'max_posts' ) }
						/>
					</div>
				</SegmentSettingSection>
				<SegmentSettingSection title={ __( 'Newsletter', 'newspack' ) }>
					<CheckboxControl
						checked={ segmentConfig.is_subscribed }
						onChange={ updateSegmentConfig( 'is_subscribed' ) }
						label={ __( 'Is subscribed to newsletter', 'newspack' ) }
					/>
					<CheckboxControl
						checked={ segmentConfig.is_not_subscribed }
						onChange={ updateSegmentConfig( 'is_not_subscribed' ) }
						label={ __( 'Is not subscribed to newsletter', 'newspack' ) }
					/>
				</SegmentSettingSection>
				<SegmentSettingSection
					title={ __( 'Donation', 'newspack' ) }
					description={ __( '(if using WooCommerce checkout)', 'newspack' ) }
				>
					<CheckboxControl
						checked={ segmentConfig.is_donor }
						onChange={ updateSegmentConfig( 'is_donor' ) }
						label={ __( 'Has donated', 'newspack' ) }
					/>
					<CheckboxControl
						checked={ segmentConfig.is_not_donor }
						onChange={ updateSegmentConfig( 'is_not_donor' ) }
						label={ __( "Hasn't donated", 'newspack' ) }
					/>
				</SegmentSettingSection>
				<SegmentSettingSection
					title={ __( 'Category Affinity', 'newspack' ) }
					description={ __( 'Most read categories of reader.', 'newspack' ) }
				>
					<CategoryAutocomplete
						value={ segmentConfig.favorite_categories }
						onChange={ selected => {
							updateSegmentConfig( 'favorite_categories' )( selected.map( item => item.id ) );
						} }
						label={ __( 'Favorite Categories', 'newspack ' ) }
					/>
				</SegmentSettingSection>
			</div>

			{ reach.total > 0 && (
				<div style={ { opacity: isFetchingReach ? 0.5 : 1 } }>
					{ __( 'This segment would reach', 'newspack' ) }{' '}
					<b>
						{ Math.round( ( reach.in_segment * 100 ) / reach.total ) }
						{ '%' }
					</b>{' '}
					{ __( 'of recorded visitors. ', 'newspack' ) }
				</div>
			) }

			<div className="newspack-buttons-card">
				<div>
					<NavLink to="/segmentation">
						<Button>{ __( 'Cancel', 'newspack' ) }</Button>
					</NavLink>
					<Button disabled={ ! isSegmentValid } isPrimary onClick={ saveSegment }>
						{ __( 'Save', 'newspack' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SegmentsList;
