/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Button, withWizardScreen } from '../../../../components/src';

/**
 * Payment Method screen.
 */
class PaymentMethod extends Component {
	/**
	 * Render.
	 */
	render() {
		const { onUpdateSubscription, customer } = this.props;
		const { subscriptions } = customer || {};
		const { data: subscriptionData } = subscriptions || {};
		const hasSubscriptions = subscriptionData && subscriptionData.length > 0;
		return (
			<Fragment>
				{ ! hasSubscriptions && (
					<p>
						{ __(
							'Click the button below to subscribe to hosted Newspack. If you believe you have already subscribed, please contact Newspack support.',
							'newspack'
						) }
					</p>
				) }

				{ hasSubscriptions && (
					<Fragment>
						<h2>{ __( 'Newspack Subscription', 'newspack' ) }</h2>
						{ subscriptionData.map( subscription => {
							const { current_period_start, current_period_end, id, plan } = subscription;
							const { amount, interval, nickname } = plan;
							const currencyFormatter = new Intl.NumberFormat( 'en-US', {
								style: 'currency',
								currency: 'USD',
							} );
							const nextPayment = new Date( current_period_end * 1000 ).toLocaleDateString();
							return (
								<ActionCard
									className="newspack-card__is-supported"
									title={ nickname }
									key={ id }
									description={
										currencyFormatter.format( amount / 100 ) +
										'/' +
										interval +
										', ' +
										__( 'Next charge', 'newspack' ) +
										' ' +
										nextPayment
									}
									actionText={ __( 'Update', 'newspack' ) }
									onClick={ onUpdateSubscription }
								/>
							);
						} ) }
					</Fragment>
				) }
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
