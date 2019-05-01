import { CheckboxControl, Tooltip } from '@wordpress/components';

/**
 * Muriel-styled Checkbox.
 */
class CheckboxInput extends CheckboxControl {

	/**
	 * Render.
	 */
	render() {
		return <CheckboxControl className="newspack-checkbox" { ...this.props } />
	}
}

export default CheckboxInput;