/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, withWizardScreen } from '../../../../components/src';

/**
 * Payment Method screen.
 */
class PaymentMethod extends Component {
	/**
	 * Render.
	 */
	render() {
		const { customer } = this.props;
		const { subscriptions } = customer || {};
		const { data: subscriptionData } = subscriptions || {};
		return (
			<Fragment>
				<h1>{ __( 'Subscriptions', 'newspack' ) }</h1>
				{ ( subscriptionData || [] ).length &&
					subscriptionData.map( subscription => <p key={ subscription.id }>{ subscription.plan.nickname }</p> ) }
			</Fragment>
		);
	}
}
PaymentMethod.defaultProps = {
	customer: {
		subscriptions: {
			data: [],
		},
	},
};

export default withWizardScreen( PaymentMethod );
