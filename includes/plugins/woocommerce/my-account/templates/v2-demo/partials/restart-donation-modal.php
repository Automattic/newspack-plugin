<?php
/**
 * My Account v2 prototype — Restart donation modal partial.
 *
 * Single-step transaction flow (Figma 2636:46530): summary box + Confirm
 * button + billing readout + Stripe-style payment form. There's no Figma
 * success state for restart; on Confirm the modal closes and surfaces a
 * "Donation restarted." snackbar (subscriptions.js / donations.js).
 *
 * Same shape as the Renew subscription modal's init step, with donation-
 * specific copy: "Donate Annually: £153.00" instead of "Patron: £101.70 /
 * year". Reuses the v2-demo billing fixture passed through from the parent
 * detail template.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `donation`        => the donation row (id, amount,
 *                                         frequency_label).
 *                  - `billing`         => billing fixture (name, lines, email).
 *                  - `currency_symbol` => currency symbol.
 */

defined( 'ABSPATH' ) || exit;

$donation        = isset( $args['donation'] ) ? $args['donation'] : [];
$billing         = isset( $args['billing'] ) ? $args['billing'] : [];
$currency_symbol = isset( $args['currency_symbol'] ) ? (string) $args['currency_symbol'] : '$';
$donation_id     = isset( $donation['id'] ) ? (string) $donation['id'] : '';

$amount          = isset( $donation['amount'] ) ? (float) $donation['amount'] : 0.0;
$frequency_label = isset( $donation['frequency_label'] ) ? (string) $donation['frequency_label'] : '';
$amount_label    = $currency_symbol . number_format_i18n( $amount, 2 );
if ( $frequency_label ) {
	/* translators: %1$s: frequency label (e.g. "Annually"), %2$s: amount with currency. */
	$summary_label = sprintf( __( 'Donate %1$s: %2$s', 'newspack-plugin' ), $frequency_label, $amount_label );
} else {
	$summary_label = $amount_label;
}
?>
<div
	id="newspack-my-account__restart-donation-<?php echo esc_attr( $donation_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account__v2-demo-restart-donation"
	data-state="closed"
	data-newspack-my-account-v2-demo="restart-donation-modal"
	data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Restart donation', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content">
			<div class="newspack-ui__box newspack-ui__box--text-center">
				<p class="newspack-ui__font--bold"><?php echo esc_html( $summary_label ); ?></p>
			</div>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
				data-action="confirm"
			>
				<?php esc_html_e( 'Restart donation', 'newspack-plugin' ); ?>
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

			<div id="payment-restart-<?php echo esc_attr( $donation_id ); ?>" class="woocommerce-checkout-payment">
				<h3><?php esc_html_e( 'Payment info', 'newspack-plugin' ); ?></h3>
				<ul class="wc_payment_methods payment_methods methods">
					<li class="wc_payment_method payment_method_stripe">
						<input
							id="newspack-restart-donation-stripe-<?php echo esc_attr( $donation_id ); ?>"
							type="radio"
							class="input-radio"
							name="newspack-restart-donation-payment-method-<?php echo esc_attr( $donation_id ); ?>"
							value="stripe"
							checked
						>
						<label for="newspack-restart-donation-stripe-<?php echo esc_attr( $donation_id ); ?>">
							<?php esc_html_e( 'Credit card (Stripe)', 'newspack-plugin' ); ?>
						</label>
						<div class="payment_box payment_method_stripe">
							<p><?php esc_html_e( 'Use your credit card to pay with Stripe.', 'newspack-plugin' ); ?></p>
							<p class="form-row form-row-wide">
								<label for="newspack-restart-donation-card-<?php echo esc_attr( $donation_id ); ?>"><?php esc_html_e( 'Card number', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-restart-donation-card-<?php echo esc_attr( $donation_id ); ?>" class="input-text" placeholder="<?php esc_attr_e( '1234 1234 1234 1234', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-first">
								<label for="newspack-restart-donation-exp-<?php echo esc_attr( $donation_id ); ?>"><?php esc_html_e( 'Expiry date', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-restart-donation-exp-<?php echo esc_attr( $donation_id ); ?>" class="input-text" placeholder="<?php esc_attr_e( 'MM / YY', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-last">
								<label for="newspack-restart-donation-cvc-<?php echo esc_attr( $donation_id ); ?>"><?php esc_html_e( 'CVC', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-restart-donation-cvc-<?php echo esc_attr( $donation_id ); ?>" class="input-text" placeholder="<?php esc_attr_e( 'CVC', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-wide">
								<label class="checkbox">
									<input type="checkbox" name="newspack-restart-donation-cover-fees-<?php echo esc_attr( $donation_id ); ?>" class="input-checkbox">
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
	</div>
</div>
