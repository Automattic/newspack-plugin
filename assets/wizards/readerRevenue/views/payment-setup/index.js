/**
 * Payment Setup Screen
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';

/**
 * Payment Setup Screen Component
 */
class PaymentSetup extends Component {
	/**
	 * Render.
	 */
	render() {
		return <p>Payment Setup TK</p>;
	}
}

export default withWizardScreen( PaymentSetup );
