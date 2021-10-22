/**
 * Ad Unit Size Control.
 *
 * Select from a subset of sizes, or enter custom width and height.
 */

/**
 * External dependencies.
 */
import { startCase } from 'lodash';

/**
 * WordPress dependencies.
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { SelectControl, TextControl } from '../../../../components/src';

/**
 * Interactive Advertising Bureau's standard ad sizes.
 */
export const DEFAULT_SIZES = [
	[ 970, 250 ],
	[ 970, 90 ],
	[ 728, 90 ],
	[ 300, 600 ],
	[ 300, 250 ],
	[ 300, 1050 ],
	[ 160, 600 ],
	[ 320, 50 ],
	[ 320, 100 ],
	[ 120, 60 ],
	'fluid',
];

/**
 * Ad Unit Size Control.
 */
const AdUnitSizeControl = ( { value, selectedOptions, onChange } ) => {
	const [ width, height ] = value;
	const [ isCustom, setIsCustom ] = useState( false );
	const options = DEFAULT_SIZES.filter(
		size =>
			JSON.stringify( value ) === JSON.stringify( size ) ||
			! selectedOptions.find(
				selectedOption => JSON.stringify( selectedOption ) === JSON.stringify( size )
			)
	);
	const sizeIndex = isCustom
		? -1
		: options.findIndex(
				size => value === size || ( size[ 0 ] === width && size[ 1 ] === height )
		  );
	return (
		<>
			<SelectControl
				label={ __( 'Size', 'newspack' ) }
				value={ sizeIndex }
				options={ [
					...options.map( ( size, index ) => ( {
						label: Array.isArray( size ) ? `${ size[ 0 ] } x ${ size[ 1 ] }` : startCase( size ),
						value: index,
					} ) ),
					{ label: __( 'Custom', 'newspack' ), value: -1 },
				] }
				onChange={ index => {
					const size = options[ index ];
					setIsCustom( ! size );
					if ( size ) onChange( size );
				} }
				hideLabelFromVision
			/>
			{ value === 'fluid' && ! isCustom ? (
				<p style={ { gridColumn: '2 / 4', fontSize: '12px' } }>
					{ __(
						'Fluid is a native ad size that allows more flexibility when styling your ad. Google Ad Manager automatically sizes the ad by filling the width of the enclosing column and adjusting the height as appropriate.',
						'newspack'
					) }
				</p>
			) : (
				<>
					<TextControl
						label={ __( 'Width', 'newspack' ) }
						value={ width }
						onChange={ newWidth => onChange( [ newWidth, height ] ) }
						disabled={ ! isCustom && sizeIndex !== -1 }
						type="number"
						hideLabelFromVision
					/>
					<TextControl
						label={ __( 'Height', 'newspack' ) }
						value={ height }
						onChange={ newHeight => onChange( [ width, newHeight ] ) }
						disabled={ ! isCustom && sizeIndex !== -1 }
						type="number"
						hideLabelFromVision
					/>
				</>
			) }
		</>
	);
};

export default AdUnitSizeControl;
