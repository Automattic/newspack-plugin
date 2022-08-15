/**
 * Component for inputting money amounts.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TextControl } from '../../../../components/src';
import './style.scss';

/**
 * Settings for donation collection.
 */
class MoneyInput extends Component {
	/**
	 * Render.
	 */
	render() {
		const { currencySymbol, label, value, onChange, min } = this.props;

		return (
			<div className="newspack-donations-wizard__money-input-container">
				<p className="input-label">{ label }</p>
				<div className="newspack-donations-wizard__money-input">
					<div className="currency">{ currencySymbol }</div>
					<TextControl
						type="number"
						min={ min }
						label={ label }
						hideLabelFromVision
						value={ value }
						onChange={ onChange }
					/>
				</div>
			</div>
		);
	}
}

export default MoneyInput;
