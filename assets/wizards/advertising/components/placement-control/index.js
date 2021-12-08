/**
 * Placement Control Component.
 */

/**
 * WordPress dependencies
 */
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Notice, SelectControl, TextControl } from '../../../../components/src';

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

const PlacementControl = ( {
	adUnits = {},
	bidders = {},
	value = {},
	disabled = false,
	onChange,
	...props
} ) => {
	const [ biddersErrors, setBiddersErrors ] = useState( {} );

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

	return (
		<Fragment>
			<SelectControl
				label={ __( 'Ad Unit', 'newspack' ) }
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
				// Translators: Bidder name.
				const bidderLabel = sprintf( __( '%s Placement ID', 'newspack' ), bidder.name );
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

export default PlacementControl;
