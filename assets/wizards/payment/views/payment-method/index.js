/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';

/**
 * Payment Method screen.
 */
class PaymentMethod extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<h2>TK</h2>
			</Fragment>
		);
	}
}
PaymentMethod.defaultProps = {};

export default withWizardScreen( PaymentMethod );
