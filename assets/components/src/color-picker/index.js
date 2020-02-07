/**
 * Color Picker
 */

/**
 * WordPress dependencies.
 */
import { ColorPalette as BaseComponent } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

class ColorPicker extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, hasDefaultColors, suggestedColors, ...otherProps } = this.props;
		const classes = classnames( 'newspack-color-picker', className );
		const defaultColors = [
			{
				name: __( 'navy' ),
				color: '#001f3f',
			},
			{	name: __( 'blue' ),
				color: '#0074d9',
			},
			{
				name: __( 'aqua' ),
				color: '#7fdbff',
			},
			{
				name: __( 'teal' ),
				color: '#39cccc',
			},
			{
				name: __( 'olive' ),
				color: '#3d9970',
			},
			{
				name: __( 'green' ),
				color: '#2ecc40',
			},
			{
				name: __( 'lime' ),
				color: '#01ff70',
			},
			{
				name: __( 'yellow' ),
				color: '#ffdc00',
			},
			{
				name: __( 'orange' ),
				color: '#ff851b',
			},
			{
				name: __( 'red' ),
				color: '#ff4136',
			},
			{
				name: __( 'maroon' ),
				color: '#85144b',
			},
			{
				name: __( 'fuchsia' ),
				color: '#f012be',
			},
			{
				name: __( 'purple' ),
				color: '#b10dc9',
			},
			{
				name: __( 'black' ),
				color: '#111111',
			},
			{
				name: __( 'gray' ),
				color: '#aaaaaa',
			},
			{
				name: __( 'silver' ),
				color: '#dddddd',
			},
		];
		let colors;
		if ( hasDefaultColors ) {
			colors = defaultColors;
		} else if ( suggestedColors ) {
			colors = suggestedColors;
		} else {
			colors = null;
		}
		return <BaseComponent className={ classes } colors={ colors } { ...otherProps } />;
	}
}

export default ColorPicker;
