/**
 * Muriel-styled Checkbox.
 */

/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InfoButton from '../../components/infoButton';

class CheckboxInput extends CheckboxControl {

	/**
	 * Render.
	 */
	render() {
		const { tooltip } = this.props;
		return (
			<div className="newspack-checkbox">
				<CheckboxControl { ...this.props } />
				{ tooltip && (
					<InfoButton text={ tooltip } />
				) }
			</div>
		);
	}
}

export default CheckboxInput;
