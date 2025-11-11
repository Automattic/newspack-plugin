/**
 * A component to display a list of color palette controls with popover UI
 * similar to the core UI shown for the useColorProps hook.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, MenuGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorControl from './color-control';
import hooks from '../hooks';
import './style.scss';

/**
 * ColorControls component.
 *
 * @param    {Object}   props        - Component props.
 * @param    {string}   props.label  - Label for the color controls.
 * @param    {Color[]}  props.colors - Colors to display.
 * @typedef {Object} Color
 * @property {string}   label        - Label for the color.
 * @property {string}   value        - Value of the color.
 * @property {Function} onChange     - Function to call when the color changes.
 */
function ColorPaletteControls( { colors = [], label = __( 'Colors', 'newspack-plugin' ) } ) {
	if ( ! colors.length ) {
		return null;
	}
	const id = hooks.useUniqueId( 'color-controls' );
	return (
		<BaseControl className="newspack-color-palette-controls" id={ id } label={ label }>
			<MenuGroup>
				{ colors.map( color => (
					<ColorControl key={ color.label } label={ color.label } value={ color.value } onChange={ color.onChange } />
				) ) }
			</MenuGroup>
		</BaseControl>
	);
}

export default ColorPaletteControls;
