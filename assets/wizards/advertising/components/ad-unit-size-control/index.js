/**
 * Ad Unit Size Control.
 *
 * Select from a subset of sizes, or enter custom width and height.
 */

/**
 * WordPress dependencies.
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Grid, SelectControl, TextControl } from '../../../../components/src';

/**
 * IAB Standard Sizes.
 */
const DEFAULT_SIZES = [
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
];

/**
 * Ad Unit Size Control.
 */
const AdUnitSizeControl = ( { value, onChange } ) => {
	const [ width, height ] = value;
	const sizeIndex = DEFAULT_SIZES.findIndex( size => size[ 0 ] === width && size[ 1 ] === height );
	return (
		<Fragment>
			<SelectControl
				label={ __( 'Size', 'newspack' ) }
				value={ sizeIndex }
				options={ [
					...DEFAULT_SIZES.map( ( size, index ) => ( {
						label: `${ size[ 0 ] } x ${ size[ 1 ] }`,
						value: index,
					} ) ),
					{ label: __( 'Custom', 'newspack' ), value: -1 },
				] }
				onChange={ index => {
					onChange( DEFAULT_SIZES[ index ] || [ 120, 120 ] );
				} }
			/>
			{ sizeIndex === -1 && (
				<Grid gutter={ 32 } noMargin>
					<TextControl
						label={ __( 'Width', 'newspack' ) }
						value={ width }
						onChange={ newWidth => onChange( [ newWidth, height ] ) }
					/>
					<TextControl
						label={ __( 'Height', 'newspack' ) }
						value={ height }
						onChange={ newHeight => onChange( [ width, newHeight ] ) }
					/>
				</Grid>
			) }
		</Fragment>
	);
};

export default AdUnitSizeControl;
