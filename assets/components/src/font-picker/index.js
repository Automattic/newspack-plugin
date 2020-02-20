/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { SelectControl, TextControl, ToggleGroup } from '../';
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Font Picker.
 */
class FontPicker extends Component {
	/**
	 * Render
	 */
	render() {
		const { options, toggleGroupChecked, title } = this.props;
		return (
			<div className="newspack-font-picker">
				{ title && <h2 className="newspack-font-picker">{ title }</h2> }
				<SelectControl
					label={ __( 'Font', 'newspack' ) }
					value=""
					onChange=""
					options={ options }
				/>
				<ToggleGroup
					title={ __( 'Use custom font', 'newspack' ) }
					checked="checked"
					onChange=""
				>
					<TextControl
						label={ __( 'Embed URL', 'newspack' ) }
						help={ __( 'Example: https://fonts.googleapis.com/css?family=Public+Sans:400,400i,700,700i', 'newspack' ) }
						value=""
					/>
					<SelectControl
						label={ __( 'Fallback' ) }
						value=""
						onChange=""
						options={ [
							{ label: __( 'Sans serif' ), value: 'sans-serif' },
							{ label: __( 'Serif' ), value: 'serif' },
						] }
					/>
				</ToggleGroup>
			</div>
		);
	}
}

export default FontPicker;
