/**
 * Muriel-styled Checkbox.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InfoButton from '../../components/infoButton';
import './style.scss';

class CheckboxInput extends Component {

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
