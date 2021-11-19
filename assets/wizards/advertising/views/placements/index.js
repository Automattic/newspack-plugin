/**
 * Ads Global Placements Settings.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Grid,
	Notice,
	SectionHeader,
	SelectControl,
	TextControl,
	Button,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Get select options from object of ad units.
 *
 * @param {Object} adUnits Object containing ad untis.
 * @return {Array} Ad unit options for select control.
 */
const getAdUnitsForSelect = adUnits => {
	return [
		{
			label: __( 'Select an Ad Unit', 'newspack' ),
			value: '',
		},
		...Object.values( adUnits ).map( adUnit => {
			return {
				label: adUnit.name,
				value: adUnit.id,
			};
		} ),
	];
};

/**
 * Placement Control Component.
 */
const PlacementControl = ( {
	adUnits = {},
	bidders = {},
	placement = {},
	hook = {},
	onChange,
	...props
} ) => {
	const { data = {} } = placement;
	let label = __( 'Ad Unit', 'newspack' );
	let key = 'ad_unit';
	if ( hook.hookKey ) {
		label += ` - ${ hook.name }`;
		key = `ad_unit_${ hook.hookKey }`;
	}
	return (
		<Fragment>
			<SelectControl
				label={ label }
				value={ data[ key ] }
				options={ getAdUnitsForSelect( adUnits ) }
				onChange={ value => {
					onChange( {
						...data,
						[ key ]: value,
					} );
				} }
				{ ...props }
			/>
			{ Object.keys( bidders ).map( bidderKey => {
				// Translators: Bidder name.
				let bidderLabel = sprintf( __( '%s Placement ID', 'newspack' ), bidders[ bidderKey ] );
				if ( hook.hookKey ) {
					bidderLabel += ` - ${ hook.name }`;
				}
				return (
					<TextControl
						key={ bidderKey }
						value={ data.bidders_ids ? data.bidders_ids[ bidderKey ] : null }
						label={ bidderLabel }
						onChange={ value => {
							onChange( {
								...data,
								bidders_ids: {
									...data.bidders_ids,
									[ bidderKey ]: value,
								},
							} );
						} }
						{ ...props }
					/>
				);
			} ) }
		</Fragment>
	);
};

/**
 * Advertising Placements management screen.
 */
const Placements = ( { adUnits } ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ placements, setPlacements ] = useState( {} );
	const [ bidders, setBidders ] = useState( {} );
	const [ biddersError, setBiddersError ] = useState( null );
	const placementsApiFetch = options => {
		setInFlight( true );
		apiFetch( options )
			.then( data => {
				setPlacements( data );
				setError( null );
			} )
			.catch( err => {
				setError( err );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};
	const handlePlacementToggle = placement => value => {
		placementsApiFetch( {
			path: `/newspack-ads/v1/placements/${ placement }`,
			method: value ? 'POST' : 'DELETE',
		} );
	};
	const handlePlacementChange = placementKey => value => {
		setPlacements( {
			...placements,
			[ placementKey ]: {
				...placements[ placementKey ],
				data: value,
			},
		} );
	};
	const updatePlacement = placementKey => {
		placementsApiFetch( {
			path: `/newspack-ads/v1/placements/${ placementKey }`,
			method: 'POST',
			data: placements[ placementKey ].data,
		} );
	};
	const isEnabled = placementKey => {
		return placements[ placementKey ].data.enabled;
	};
	useEffect( () => {
		apiFetch( { path: '/newspack-ads/v1/bidders' } )
			.then( data => {
				setBidders( data );
			} )
			.catch( err => {
				setBiddersError( err );
			} );
		placementsApiFetch( { path: '/newspack-ads/v1/placements' } );
	}, [] );
	return (
		<Fragment>
			<SectionHeader
				title={ __( 'Ad Placements', 'newspack' ) }
				description={ () => (
					<>
						{ __(
							'Define global advertising placements to serve ad units on your site',
							'newspack'
						) }
						<br />
						{ __(
							'Enable the individual pre-defined ad placements to select which ads to serve',
							'newspack'
						) }
					</>
				) }
			/>
			{ error && <Notice isError noticeText={ error.message } /> }
			{ biddersError && <Notice isWarning noticeText={ biddersError.message } /> }
			<div
				className={ classnames( {
					'newspack-wizard-ads-placements': true,
					'newspack-wizard-section__is-loading': inFlight && ! Object.keys( placements ).length,
				} ) }
			>
				{ Object.keys( placements )
					.filter( key => !! isEnabled( key ) )
					.map( key => {
						const placement = placements[ key ];
						return (
							<ActionCard
								key={ key }
								isMedium
								disabled={ inFlight }
								title={ placement.name }
								description={ placement.description }
								toggleOnChange={ handlePlacementToggle( key ) }
								toggleChecked={ isEnabled( key ) }
								hasGreyHeader={ isEnabled( key ) }
							>
								<Grid columns={ 2 } gutter={ 32 }>
									{ isEnabled( key ) && placement.hook_name && (
										<PlacementControl
											adUnits={ adUnits }
											bidders={ bidders }
											placement={ placement }
											disabled={ inFlight }
											onChange={ handlePlacementChange( key ) }
										/>
									) }
									{ placement.hooks && (
										<>
											{ Object.keys( placement.hooks ).map( hookKey => {
												const hook = {
													hookKey,
													...placement.hooks[ hookKey ],
												};
												return (
													<PlacementControl
														key={ hookKey }
														adUnits={ adUnits }
														bidders={ bidders }
														placement={ placement }
														hook={ hook }
														disabled={ inFlight }
														onChange={ handlePlacementChange( key ) }
													/>
												);
											} ) }
										</>
									) }
								</Grid>
								<div className="newspack-buttons-card" style={ { margin: '32px 0 0' } }>
									<Button
										isPrimary
										disabled={ inFlight }
										onClick={ () => {
											updatePlacement( key );
										} }
									>
										{ __( 'Save placement settings', 'newspack' ) }
									</Button>
								</div>
							</ActionCard>
						);
					} ) }
				{ Object.keys( placements )
					.filter( key => ! isEnabled( key ) )
					.map( key => {
						const placement = placements[ key ];
						return (
							<ActionCard
								key={ key }
								isSmall
								disabled={ inFlight }
								title={ placement.name }
								toggleOnChange={ handlePlacementToggle( key ) }
							/>
						);
					} ) }
			</div>
		</Fragment>
	);
};

export default withWizardScreen( Placements );
