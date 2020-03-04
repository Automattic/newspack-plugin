/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Notice, withWizardScreen } from '../../../../components/src';

/**
 * Payment Method screen.
 */
class PaymentMethod extends Component {
	/**
	 * Generate subscription/card description.
	 */
	cardDescription = ( subscription, { card } ) => {
		if ( ! subscription || ! card ) {
			return null;
		}
		const { current_period_end: currentPeriodEnd, plan } = subscription;
		const { amount, interval } = plan;
		const { last4 } = card;
		const currencyFormatter = new Intl.NumberFormat( 'en-US', {
			style: 'currency',
			currency: 'USD',
		} );
		return [
			currencyFormatter.format( amount / 100 ),
			'/',
			interval,
			', ',
			__( 'Next charge', 'newspack' ),
			' ',
			new Date( currentPeriodEnd * 1000 ).toLocaleDateString(),
			<br key="separator" />,
			__( ' Card ending in ', 'newspack' ),
			last4,
		];
	};

	/**
	 * Render.
	 */
	render() {
		const { card, hasData, onUpdateSubscription, subscription } = this.props;
		const { plan } = subscription || {};
		const { nickname } = plan || {};
		return (
			<Fragment>
				{ hasData && ! subscription && (
					<Fragment>
						<Notice noticeText={ __( 'Newspack subscription inactive', 'newspack' ) } isError />
						<p>
							{ __(
								'Click the button below to subscribe to hosted Newspack. If you believe you have already subscribed, please contact Newspack support.',
								'newspack'
							) }
						</p>
					</Fragment>
				) }

				{ hasData && subscription && (
					<Fragment>
						<Notice noticeText={ __( 'Newspack subscription active', 'newspack' ) } isSuccess />
						<ActionCard
							className="newspack-card__is-supported"
							title={ nickname }
							description={ this.cardDescription( subscription, card ) }
							actionText={ __( 'Update', 'newspack' ) }
							onClick={ onUpdateSubscription }
						/>
					</Fragment>
				) }

				{ hasData && (
					<p>
						<em>{ __( 'Taxes included where applicable.', 'newspack' ) }</em>
					</p>
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
