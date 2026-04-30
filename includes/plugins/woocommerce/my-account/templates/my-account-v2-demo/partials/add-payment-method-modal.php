<?php
/**
 * My Account v2 prototype — Add payment method modal partial.
 *
 * Targets Figma frame `2636:45450` (Add payment method - Multiple
 * methods). Singleton — one instance per page; opened by every
 * `.newspack-my-account__add-payment-method` trigger. Pattern mirrors v1's
 * `My_Account_UI_V1::add_payment_method_modal` and the Phase 4 change-
 * subscription transaction step's payment-methods list (`<ul
 * class="wc_payment_methods">` → `<li class="wc_payment_method
 * payment_method_<id>">` with an `<input type="radio" class="input-radio">`
 * + an expandable `.payment_box`). Stripe is pre-selected; Check / PayPal
 * collapsed. The `<label for="…">` references hook native radio toggling,
 * so no JS is needed for the radio behaviour itself.
 *
 * Submit handler in `payment-methods.js` snackbars + closes the modal.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `reader_email` (unused today; reserved for future
 *                    receipt / billing-readout copy that Figma doesn't yet
 *                    pin down on this modal).
 */

defined( 'ABSPATH' ) || exit;
?>
<div
	id="newspack-my-account__add-payment-method"
	class="newspack-ui newspack-ui__modal-container newspack-my-account-v2-demo-add-payment-method"
	data-state="closed"
	data-newspack-my-account-v2-demo="add-payment-method-modal"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Add payment method', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content">
			<div id="payment" class="woocommerce-checkout-payment">
				<ul class="wc_payment_methods payment_methods methods">
					<li class="wc_payment_method payment_method_stripe">
						<input
							id="newspack-add-payment-method__stripe"
							type="radio"
							class="input-radio"
							name="newspack-add-payment-method"
							value="stripe"
							checked
						>
						<label for="newspack-add-payment-method__stripe">
							<?php esc_html_e( 'Credit card (Stripe)', 'newspack-plugin' ); ?>
						</label>
						<div class="payment_box payment_method_stripe">
							<p><?php esc_html_e( 'Use your credit card to pay with Stripe.', 'newspack-plugin' ); ?></p>
							<p class="form-row form-row-wide">
								<label for="newspack-add-payment-method__card"><?php esc_html_e( 'Card number', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-add-payment-method__card" class="input-text" placeholder="<?php esc_attr_e( '1234 1234 1234 1234', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-first">
								<label for="newspack-add-payment-method__exp"><?php esc_html_e( 'Expiry date', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-add-payment-method__exp" class="input-text" placeholder="<?php esc_attr_e( 'MM / YY', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
							<p class="form-row form-row-last">
								<label for="newspack-add-payment-method__cvc"><?php esc_html_e( 'CVC', 'newspack-plugin' ); ?></label>
								<input type="text" id="newspack-add-payment-method__cvc" class="input-text" placeholder="<?php esc_attr_e( 'CVC', 'newspack-plugin' ); ?>" autocomplete="off">
							</p>
						</div>
					</li>
					<li class="wc_payment_method payment_method_cheque">
						<input
							id="newspack-add-payment-method__cheque"
							type="radio"
							class="input-radio"
							name="newspack-add-payment-method"
							value="cheque"
						>
						<label for="newspack-add-payment-method__cheque">
							<?php esc_html_e( 'Check payment', 'newspack-plugin' ); ?>
						</label>
						<div class="payment_box payment_method_cheque" style="display:none;">
							<p><?php esc_html_e( 'Pay in person with a personal check.', 'newspack-plugin' ); ?></p>
						</div>
					</li>
					<li class="wc_payment_method payment_method_paypal">
						<input
							id="newspack-add-payment-method__paypal"
							type="radio"
							class="input-radio"
							name="newspack-add-payment-method"
							value="paypal"
						>
						<label for="newspack-add-payment-method__paypal">
							<?php esc_html_e( 'PayPal', 'newspack-plugin' ); ?>
						</label>
						<div class="payment_box payment_method_paypal" style="display:none;">
							<p><?php esc_html_e( 'Use your PayPal account to pay.', 'newspack-plugin' ); ?></p>
						</div>
					</li>
				</ul>
			</div>

			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3">
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
					data-action="confirm"
				>
					<?php esc_html_e( 'Save payment method', 'newspack-plugin' ); ?>
				</button>
				<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
					<?php esc_html_e( 'Cancel', 'newspack-plugin' ); ?>
				</button>
			</div>

			<p class="newspack-ui__helper-text">
				<?php
				printf(
					/* translators: 1: site name, 2: opening anchor for terms-of-service link, 3: closing anchor. */
					esc_html__( 'By providing your card information, you allow %1$s to charge your card for future payments in accordance with the %2$sTerms of Service%3$s.', 'newspack-plugin' ),
					esc_html( get_bloginfo( 'name' ) ),
					'<a href="#">',
					'</a>'
				);
				?>
			</p>
		</div>
	</div>
</div>
