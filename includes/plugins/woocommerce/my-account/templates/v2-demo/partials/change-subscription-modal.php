<?php
/**
 * My Account v2 prototype — Change subscription modal partial.
 *
 * Renders the four Figma frames as a single modal container with two visual
 * steps and internal interaction state (selected frequency tab + selected
 * tier). JS in `subscriptions.js` drives the transitions:
 *  - Init   (Figma 2636:46318) — current tier preselected with CURRENT badge,
 *                                Change button disabled.
 *  - Monthly selected (2636:46331) — switching tab clears selection, Change
 *                                    button stays disabled.
 *  - Plan selected (2636:46344) — picking a non-current tier enables Change.
 *  - Transaction (2636:46297) — second visual step with summary, billing
 *                                details, payment form, "Pay" button → snackbar.
 *
 * Markup follows v1's `Subscriptions_Tiers::render_modal` + `render_form`
 * conventions: tier cards as `<label class="newspack-ui__input-card current">`
 * with `<strong>` + `.newspack-ui__helper-text`, segmented control via
 * `__tabs` + `__content` + `__panel.selected`, action buttons rendered
 * directly inside `.newspack-ui__modal__content` (NOT a `__footer`, which
 * carries a grey background that we don't want here).
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `tiers`           => tiers slice from get_fake_subscriptions()
 *                  - `subscription`    => the subscription row this modal is for
 *                                         (used for `current_tier`, `frequency`)
 *                  - `currency_symbol` => currency symbol from the fake-data
 *                                         payload (e.g. '$', '£') so the modal
 *                                         stays in lockstep with the list and
 *                                         detail templates instead of hard-coding.
 */

defined( 'ABSPATH' ) || exit;

$tiers           = isset( $args['tiers'] ) ? $args['tiers'] : [];
$subscription    = isset( $args['subscription'] ) ? $args['subscription'] : [];
$currency_symbol = isset( $args['currency_symbol'] ) ? (string) $args['currency_symbol'] : '$';

$frequencies = isset( $tiers['frequencies'] ) ? $tiers['frequencies'] : [];
$billing     = isset( $tiers['billing'] ) ? $tiers['billing'] : [];

$current_tier_id   = isset( $subscription['current_tier'] ) ? (string) $subscription['current_tier'] : '';
$current_frequency = isset( $subscription['frequency'] ) ? (string) $subscription['frequency'] : 'year';
$subscription_id   = isset( $subscription['id'] ) ? (string) $subscription['id'] : '';

if ( empty( $frequencies ) ) {
	return;
}

$format_amount = static function ( $amount ) use ( $currency_symbol ) {
	return $currency_symbol . number_format_i18n( (float) $amount, 2 );
};
?>
<div
	id="newspack-my-account__change-subscription-<?php echo esc_attr( $subscription_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account__v2-demo-change-subscription"
	data-state="closed"
	data-newspack-my-account-v2-demo="change-subscription-modal"
	data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
	data-current-tier="<?php echo esc_attr( $current_tier_id ); ?>"
	data-current-frequency="<?php echo esc_attr( $current_frequency ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Change subscription', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content" data-step="select">
			<div class="newspack-ui__segmented-control">
				<div class="newspack-ui__segmented-control__tabs" role="tablist" aria-label="<?php esc_attr_e( 'Subscription frequency', 'newspack-plugin' ); ?>">
					<?php foreach ( $frequencies as $freq ) : ?>
						<?php
						$freq_id    = isset( $freq['id'] ) ? (string) $freq['id'] : '';
						$freq_label = isset( $freq['label'] ) ? (string) $freq['label'] : '';
						$is_current = $freq_id === $current_frequency;
						$tab_class  = 'newspack-ui__button newspack-ui__button--small';
						if ( $is_current ) {
							$tab_class .= ' selected';
						}
						?>
						<button
							type="button"
							class="<?php echo esc_attr( $tab_class ); ?>"
							role="tab"
							data-frequency="<?php echo esc_attr( $freq_id ); ?>"
							aria-selected="<?php echo $is_current ? 'true' : 'false'; ?>"
						>
							<?php echo esc_html( $freq_label ); ?>
						</button>
					<?php endforeach; ?>
				</div>
				<div class="newspack-ui__segmented-control__content">
					<?php foreach ( $frequencies as $freq ) : ?>
						<?php
						$freq_id    = isset( $freq['id'] ) ? (string) $freq['id'] : '';
						$freq_unit  = isset( $freq['unit'] ) ? (string) $freq['unit'] : $freq_id;
						$products   = isset( $freq['products'] ) ? $freq['products'] : [];
						$is_current = $freq_id === $current_frequency;
						$panel_cls  = 'newspack-ui__segmented-control__panel';
						if ( $is_current ) {
							$panel_cls .= ' selected';
						}
						?>
						<div
							class="<?php echo esc_attr( $panel_cls ); ?>"
							data-frequency-panel="<?php echo esc_attr( $freq_id ); ?>"
							role="tabpanel"
						>
							<?php foreach ( $products as $product ) : ?>
								<?php
								$tier_id         = isset( $product['id'] ) ? (string) $product['id'] : '';
								$tier_name       = isset( $product['name'] ) ? (string) $product['name'] : '';
								$tier_price      = isset( $product['price'] ) ? (float) $product['price'] : 0.0;
								$is_current_tier = $tier_id === $current_tier_id;
								/* translators: %1$s: amount with currency, %2$s: frequency unit. */
								$price_label = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $format_amount( $tier_price ), $freq_unit );
								$radio_name  = 'newspack-change-subscription-tier-' . $subscription_id;
								?>
								<label
									class="newspack-ui__input-card<?php echo $is_current_tier ? ' current' : ''; ?>"
									data-tier-card
									data-tier-id="<?php echo esc_attr( $tier_id ); ?>"
									data-frequency="<?php echo esc_attr( $freq_id ); ?>"
								>
									<?php if ( $is_current_tier ) : ?>
										<span class="newspack-ui__badge newspack-ui__badge--primary" data-tier-current-badge>
											<?php esc_html_e( 'Current', 'newspack-plugin' ); ?>
										</span>
									<?php endif; ?>
									<input
										type="radio"
										name="<?php echo esc_attr( $radio_name ); ?>"
										value="<?php echo esc_attr( $tier_id ); ?>"
										data-tier-radio
										<?php checked( $is_current_tier ); ?>
									>
									<strong><?php echo esc_html( $tier_name ); ?></strong>
									<span class="newspack-ui__helper-text"><?php echo esc_html( $price_label ); ?></span>
								</label>
							<?php endforeach; ?>
						</div>
					<?php endforeach; ?>
				</div>
			</div>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
				data-action="advance-to-transaction"
				disabled
			>
				<?php esc_html_e( 'Change subscription', 'newspack-plugin' ); ?>
			</button>
			<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
				<?php esc_html_e( 'Cancel', 'newspack-plugin' ); ?>
			</button>
		</div>

		<div class="newspack-ui__modal__content" data-step="transaction" hidden>
			<div class="newspack-ui__box newspack-ui__box--text-center">
				<p class="newspack-ui__font--bold" data-transaction-summary>
					<?php esc_html_e( 'Patron: $9.99 / month', 'newspack-plugin' ); ?>
				</p>
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--wide"
					data-action="back-to-select"
				>
					<?php esc_html_e( 'Edit', 'newspack-plugin' ); ?>
				</button>
			</div>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
				data-action="confirm-change"
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
						$lines = isset( $billing['lines'] ) ? $billing['lines'] : [];
						foreach ( $lines as $line ) :
							?>
							<?php echo esc_html( $line ); ?><br>
						<?php endforeach; ?>
					</address>
					<?php if ( ! empty( $billing['email'] ) ) : ?>
						<p class="woocommerce-customer-details--email"><?php echo esc_html( $billing['email'] ); ?></p>
					<?php endif; ?>
				</section>
			<?php endif; ?>

			<div id="payment" class="woocommerce-checkout-payment">
				<h3><?php esc_html_e( 'Payment info', 'newspack-plugin' ); ?></h3>
				<ul class="wc_payment_methods payment_methods methods">
					<li class="wc_payment_method payment_method_stripe">
						<input
							id="payment_method_stripe"
							type="radio"
							class="input-radio"
							name="payment_method"
							value="stripe"
							checked
						>
						<label for="payment_method_stripe">
							<?php esc_html_e( 'Credit card (Stripe)', 'newspack-plugin' ); ?>
						</label>
						<div class="payment_box payment_method_stripe">
							<p><?php esc_html_e( 'Use your credit card to pay with Stripe.', 'newspack-plugin' ); ?></p>
							<p class="form-row form-row-wide">
								<label for="newspack-change-subscription-card"><?php esc_html_e( 'Card number', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-change-subscription-card" class="input-text" placeholder="<?php esc_attr_e( '1234 1234 1234 1234', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-first">
								<label for="newspack-change-subscription-exp"><?php esc_html_e( 'Expiry date', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-change-subscription-exp" class="input-text" placeholder="<?php esc_attr_e( 'MM / YY', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-last">
								<label for="newspack-change-subscription-cvc"><?php esc_html_e( 'CVC', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-change-subscription-cvc" class="input-text" placeholder="<?php esc_attr_e( 'CVC', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-wide">
								<label class="checkbox">
									<input type="checkbox" name="newspack-change-subscription-cover-fees" class="input-checkbox">
									<?php esc_html_e( 'Cover transaction fees?', 'newspack-plugin' ); ?>
								</label>
								<span class="newspack-ui__helper-text">
									<?php esc_html_e( 'Cover Stripe’s 2% transaction fee, so that The News Paper receives 100% of your payment.', 'newspack-plugin' ); ?>
								</span>
							</p>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
