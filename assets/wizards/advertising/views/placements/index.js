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
 * Whether any `sizesToCheck` size exists in `sizes`.
 *
 * @param {Array} sizes Array of sizes.
 * @param {Array} sizesToCheck Array of sizes to check.
 * @return {Boolean} Whether any size was found.
 */
const hasAnySize = ( sizes, sizesToCheck ) => {
	return sizesToCheck.some( sizeToCheck => {
		return ( sizes || [] ).find(
			size => size[ 0 ] === sizeToCheck[ 0 ] && size[ 1 ] === sizeToCheck[ 1 ]
		);
	} );
};

/**
 * Placement Control Component.
 */
const PlacementControl = ( {
	adUnits = {},
	bidders = {},
	value = {},
	hook = {},
	disabled = false,
	onChange,
	...props
} ) => {
	const [ biddersErrors, setBiddersErrors ] = useState( {} );
	const adUnitLabel = hook.name
		? // Translators: Ad placement hook name.
		  sprintf( __( 'Ad Unit - %s', 'newspack' ), hook.name )
		: __( 'Ad Unit', 'newspack' );

	useEffect( () => {
		const errors = {};
		Object.keys( bidders ).forEach( bidderKey => {
			const bidder = bidders[ bidderKey ];
			const supported =
				value.ad_unit &&
				adUnits[ value.ad_unit ] &&
				hasAnySize( bidder.ad_sizes, adUnits[ value.ad_unit ].sizes );
			errors[ bidderKey ] =
				! value.ad_unit || supported
					? null
					: sprintf(
							// Translators: Ad bidder name.
							__( '%s does not support the selected ad unit sizes.', 'newspack' ),
							bidder.name,
							''
					  );
		} );
		setBiddersErrors( errors );
	}, [ adUnits, value.ad_unit ] );

	return (
		<Fragment>
			<SelectControl
				label={ adUnitLabel }
				value={ value.ad_unit }
				options={ getAdUnitsForSelect( adUnits ) }
				onChange={ data => {
					onChange( {
						...value,
						ad_unit: data,
					} );
				} }
				disabled={ disabled }
				{ ...props }
			/>
			{ Object.keys( bidders ).map( bidderKey => {
				const bidder = bidders[ bidderKey ];
				const bidderLabel = hook.name
					? // Translators: %1: Bidder name. %2 Ad placement hook name.
					  sprintf( __( '%1$s Placement ID - %2$s', 'newspack' ), bidder.name, hook.name )
					: // Translators: Bidder name.
					  sprintf( __( '%s Placement ID', 'newspack' ), bidder.name );
				return (
					<TextControl
						key={ bidderKey }
						value={ value.bidders_ids ? value.bidders_ids[ bidderKey ] : null }
						label={ bidderLabel }
						disabled={ biddersErrors[ bidderKey ] || disabled }
						onChange={ data => {
							onChange( {
								...value,
								bidders_ids: {
									...value.bidders_ids,
									[ bidderKey ]: data,
								},
							} );
						} }
						{ ...props }
					/>
				);
			} ) }
			{ Object.keys( biddersErrors ).map( bidderKey => {
				if ( biddersErrors[ bidderKey ] ) {
					return (
						<Notice key={ bidderKey } isWarning>
							{ biddersErrors[ bidderKey ] }
						</Notice>
					);
				}
				return null;
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
	const handlePlacementChange = ( placementKey, hookKey ) => value => {
		const placementData = placements[ placementKey ]?.data;
		let data = {
			...placementData,
			...value,
		};
		if ( hookKey ) {
			data = {
				...placementData,
				hooks: {
					...placementData.hooks,
					[ hookKey ]: value,
				},
			};
		}
		setPlacements( {
			...placements,
			[ placementKey ]: {
				...placements[ placementKey ],
				data,
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
		return placements[ placementKey ].data?.enabled;
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
								<Grid columns={ 1 } gutter={ 32 }>
									{ isEnabled( key ) && placement.hook_name && (
										<PlacementControl
											adUnits={ adUnits }
											bidders={ bidders }
											value={ placement.data }
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
														value={ placement.data?.hooks ? placement.data.hooks[ hookKey ] : {} }
														hook={ hook }
														disabled={ inFlight }
														onChange={ handlePlacementChange( key, hookKey ) }
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
