/**
 * Placement Control Component.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Notice, SelectControl, TextControl } from '../../../../components/src';

/**
 * Get select options from object of ad units.
 *
 * @param {Array} providers List of providers.
 * @return {Array} Providers options for select control.
 */
const getProvidersForSelect = providers => {
	return [
		{
			label: __( 'Select a provider', 'newspack' ),
			value: '',
		},
		...providers.map( unit => {
			return {
				label: unit.name,
				value: unit.id,
			};
		} ),
	];
};

/**
 * Get select options from object of ad units.
 *
 * @param {Object} provider Provider object.
 * @return {Array} Ad unit options for select control.
 */
const getProviderUnitsForSelect = provider => {
	if ( ! provider?.units ) {
		return [];
	}
	return [
		{
			label: __( 'Select an Ad Unit', 'newspack' ),
			value: '',
		},
		...provider.units.map( unit => {
			return {
				label: unit.name,
				value: unit.value,
			};
		} ),
	];
};

/**
 * Whether any `sizesToCheck` size exists in `sizes`.
 *
 * @param {Array} sizes        Array of sizes.
 * @param {Array} sizesToCheck Array of sizes to check.
 * @return {boolean} Whether any size was found.
 */
const hasAnySize = ( sizes, sizesToCheck ) => {
	return sizesToCheck.some( sizeToCheck => {
		return ( sizes || [] ).find(
			size => size[ 0 ] === sizeToCheck[ 0 ] && size[ 1 ] === sizeToCheck[ 1 ]
		);
	} );
};

const PlacementControl = ( {
	label = __( 'Ad Unit', 'newspack' ),
	adUnits = {},
	bidders = {},
	value = {},
	disabled = false,
	onChange,
	...props
} ) => {
	const [ error, setError ] = useState( null );
	const [ inFlight, setInFlight ] = useState( false );
	const [ biddersErrors, setBiddersErrors ] = useState( {} );
	const [ providers, setProviders ] = useState( [] );

	useEffect( async () => {
		setInFlight( true );
		try {
			const data = await apiFetch( { path: '/newspack-ads/v1/providers' } );
			setProviders( data );
		} catch ( err ) {
			setError( err );
		}
		setInFlight( false );
	}, [] );

	useEffect( () => {
		const errors = {};
		Object.keys( bidders ).forEach( bidderKey => {
			const bidder = bidders[ bidderKey ];
			const supported =
				value.ad_unit &&
				adUnits[ value.ad_unit ] &&
				hasAnySize( bidder.ad_sizes, adUnits[ value.ad_unit ].sizes );
			errors[ bidderKey ] =
				! value.ad_unit || ! adUnits[ value.ad_unit ] || supported
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

	if ( error ) {
		return <Notice isError noticeText={ error.message } />;
	}

	const placementProvider = providers.find(
		provider => provider.id === ( value.provider || 'gam' )
	);

	return (
		<Fragment>
			<SelectControl
				label={ __( 'Provider', 'newspack' ) }
				value={ value.provider || 'gam' }
				options={ getProvidersForSelect( providers ) }
				onChange={ provider => onChange( { ...value, provider } ) }
				disabled={ inFlight || disabled }
			/>
			<SelectControl
				label={ label }
				value={ value.ad_unit }
				options={ getProviderUnitsForSelect( placementProvider ) }
				onChange={ data => {
					onChange( {
						...value,
						ad_unit: data,
					} );
				} }
				disabled={ inFlight || disabled }
				{ ...props }
			/>
			{ placementProvider?.id === 'gam' &&
				Object.keys( bidders ).map( bidderKey => {
					const bidder = bidders[ bidderKey ];
					// Translators: Bidder name.
					const bidderLabel = sprintf( __( '%s Placement ID', 'newspack' ), bidder.name );
					return (
						<TextControl
							key={ bidderKey }
							value={ value.bidders_ids ? value.bidders_ids[ bidderKey ] : null }
							label={ bidderLabel }
							disabled={ inFlight || biddersErrors[ bidderKey ] || disabled }
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
			{ placementProvider?.id === 'gam' &&
				Object.keys( biddersErrors ).map( bidderKey => {
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

export default PlacementControl;
