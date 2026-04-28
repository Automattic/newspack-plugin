<?php
/**
 * My Account v2 prototype — Renew subscription modal partial.
 *
 * Two visual steps in one modal container:
 *  - init    (Figma 2636:46276) — summary box + Pay button + billing
 *                                 readout + Stripe-style payment form.
 *  - success (Figma 2636:46269) — green-check success box + email-sent
 *                                 line + "Done" close button.
 *
 * Markup follows the same v1/newspack-ui conventions as the Phase 4 Change
 * subscription modal's transaction step (form-row inputs, customer-details
 * billing readout, wc_payment_methods radio + payment_box). Action buttons
 * render directly inside `.newspack-ui__modal__content` (NOT a footer —
 * Phase 4 lesson). Reuses the `tiers.billing` fake-data fixture so the
 * billing details stay in lockstep with the Change subscription modal.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `subscription`    => the subscription row (id, product,
 *                                         amount, frequency).
 *                  - `billing`         => `tiers.billing` fixture (name,
 *                                         lines, email).
 *                  - `currency_symbol` => currency symbol from the fake-data
 *                                         payload.
 *                  - `reader_email`    => email surfaced in the success copy.
 */

defined( 'ABSPATH' ) || exit;

$subscription    = isset( $args['subscription'] ) ? $args['subscription'] : [];
$billing         = isset( $args['billing'] ) ? $args['billing'] : [];
$currency_symbol = isset( $args['currency_symbol'] ) ? (string) $args['currency_symbol'] : '$';
$reader_email    = isset( $args['reader_email'] ) ? (string) $args['reader_email'] : '';
$subscription_id = isset( $subscription['id'] ) ? (string) $subscription['id'] : '';

$product_name   = isset( $subscription['product'] ) ? (string) $subscription['product'] : '';
$amount         = isset( $subscription['amount'] ) ? (float) $subscription['amount'] : 0.0;
$frequency_unit = isset( $subscription['frequency'] ) ? (string) $subscription['frequency'] : '';
$amount_label   = $currency_symbol . number_format_i18n( $amount, 2 );
if ( $frequency_unit ) {
	/* translators: %1$s: amount with currency, %2$s: frequency unit. */
	$amount_per = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $amount_label, $frequency_unit );
} else {
	$amount_per = $amount_label;
}
$summary_label = $product_name
	? sprintf(
		/* translators: %1$s: subscription tier name, %2$s: amount + frequency. */
		__( '%1$s: %2$s', 'newspack-plugin' ),
		$product_name,
		$amount_per
	)
	: $amount_per;
?>
<div
	id="newspack-my-account__renew-subscription-<?php echo esc_attr( $subscription_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account__v2-demo-renew-subscription"
	data-state="closed"
	data-newspack-my-account-v2-demo="renew-subscription-modal"
	data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Renew subscription', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content" data-step="init">
			<div class="newspack-ui__box newspack-ui__box--text-center">
				<p class="newspack-ui__font--bold"><?php echo esc_html( $summary_label ); ?></p>
			</div>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
				data-action="confirm"
			>
				<?php esc_html_e( 'Pay now', 'newspack-plugin' ); ?>
			</button>

			<?php if ( ! empty( $billing ) ) : ?>
				<section class="woocommerce-customer-details">
					<h3><?php esc_html_e( 'Billing details', 'newspack-plugin' ); ?></h3>
					<address>
						<?php if ( ! empty( $billing['name'] ) ) : ?>
							<?php echo esc_html( $billing['name'] ); ?><br>
						<?php endif; ?>
						<?php
						$billing_lines = isset( $billing['lines'] ) ? $billing['lines'] : [];
						foreach ( $billing_lines as $line ) :
							?>
							<?php echo esc_html( $line ); ?><br>
						<?php endforeach; ?>
					</address>
					<?php if ( ! empty( $billing['email'] ) ) : ?>
						<p class="woocommerce-customer-details--email"><?php echo esc_html( $billing['email'] ); ?></p>
					<?php endif; ?>
				</section>
			<?php endif; ?>

			<div id="payment-renew-<?php echo esc_attr( $subscription_id ); ?>" class="woocommerce-checkout-payment">
				<h3><?php esc_html_e( 'Payment info', 'newspack-plugin' ); ?></h3>
				<ul class="wc_payment_methods payment_methods methods">
					<li class="wc_payment_method payment_method_stripe">
						<input
							id="newspack-renew-subscription-stripe-<?php echo esc_attr( $subscription_id ); ?>"
							type="radio"
							class="input-radio"
							name="newspack-renew-subscription-payment-method-<?php echo esc_attr( $subscription_id ); ?>"
							value="stripe"
							checked
						>
						<label for="newspack-renew-subscription-stripe-<?php echo esc_attr( $subscription_id ); ?>">
							<?php esc_html_e( 'Credit card (Stripe)', 'newspack-plugin' ); ?>
						</label>
						<div class="payment_box payment_method_stripe">
							<p><?php esc_html_e( 'Use your credit card to pay with Stripe.', 'newspack-plugin' ); ?></p>
							<p class="form-row form-row-wide">
								<label for="newspack-renew-subscription-card-<?php echo esc_attr( $subscription_id ); ?>"><?php esc_html_e( 'Card number', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-renew-subscription-card-<?php echo esc_attr( $subscription_id ); ?>" class="input-text" placeholder="<?php esc_attr_e( '1234 1234 1234 1234', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-first">
								<label for="newspack-renew-subscription-exp-<?php echo esc_attr( $subscription_id ); ?>"><?php esc_html_e( 'Expiry date', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-renew-subscription-exp-<?php echo esc_attr( $subscription_id ); ?>" class="input-text" placeholder="<?php esc_attr_e( 'MM / YY', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-last">
								<label for="newspack-renew-subscription-cvc-<?php echo esc_attr( $subscription_id ); ?>"><?php esc_html_e( 'CVC', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-renew-subscription-cvc-<?php echo esc_attr( $subscription_id ); ?>" class="input-text" placeholder="<?php esc_attr_e( 'CVC', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-wide">
								<label class="checkbox">
									<input type="checkbox" name="newspack-renew-subscription-cover-fees-<?php echo esc_attr( $subscription_id ); ?>" class="input-checkbox">
									<?php esc_html_e( 'Cover transaction fees?', 'newspack-plugin' ); ?>
								</label>
								<span class="newspack-ui__helper-text">
									<?php
									printf(
										/* translators: %s: site name. */
										esc_html__( 'Cover Stripe’s 2%% transaction fee, so that %s receives 100%% of your payment.', 'newspack-plugin' ),
										esc_html( get_bloginfo( 'name' ) )
									);
									?>
								</span>
							</p>
						</div>
					</li>
				</ul>
			</div>
		</div>

		<div class="newspack-ui__modal__content" data-step="success" hidden>
			<div class="newspack-ui__box newspack-ui__box--success newspack-ui__box--text-center">
				<span class="newspack-ui__icon newspack-ui__icon--success">
					<?php \Newspack\Newspack_UI_Icons::print_svg( 'check' ); ?>
				</span>
				<p>
					<strong>
					<?php
						printf(
							/* translators: %s: site name. */
							esc_html__( 'Thank you for supporting %s! Your transaction was successful.', 'newspack-plugin' ),
							esc_html( get_bloginfo( 'name' ) )
						);
						?>
						</strong>
				</p>
				<?php if ( '' !== $reader_email ) : ?>
					<p>
						<?php
						echo wp_kses(
							sprintf(
								/* translators: %s: reader email address in <strong>. */
								__( 'We have just sent a confirmation email to %s.', 'newspack-plugin' ),
								'<strong>' . esc_html( $reader_email ) . '</strong>'
							),
							[ 'strong' => [] ]
						);
						?>
					</p>
				<?php endif; ?>
			</div>

			<button type="button" class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide newspack-ui__modal__close">
				<?php esc_html_e( 'Done', 'newspack-plugin' ); ?>
			</button>
		</div>
	</div>
</div>
