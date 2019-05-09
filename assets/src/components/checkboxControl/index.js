/**
 * Muriel-styled Checkbox.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { CheckboxControl as BaseComponent } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InfoButton from '../../components/infoButton';
import './style.scss';

class CheckboxControl extends Component {

	/**
	 * Render.
	 */
	render() {
		const { tooltip } = this.props;
		return (
			<div className="muriel-checkbox">
				<BaseComponent { ...this.props } />
				{ tooltip && (
					<InfoButton text={ tooltip } />
				) }
			</div>
		);
	}
}

export default CheckboxControl;
