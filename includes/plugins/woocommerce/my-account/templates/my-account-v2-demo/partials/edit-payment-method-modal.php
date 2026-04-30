<?php
/**
 * My Account v2 prototype — Edit payment method modal partial.
 *
 * Targets Figma frame `2636:45438` (Edit card). Per-card instance — modal
 * id `newspack-my-account__edit-payment-method-<method-id>`. Renders a card
 * form (number / expiry / CVC) pre-populated with the masked last4 from
 * the fake-data row, plus a "Set as default" checkbox and a ToS footer.
 *
 * The Figma frame also shows a secondary "Add new payment method" button
 * directly under the primary "Update payment method" CTA. Treated as a
 * Figma artifact (v1's `add_payment_method_modal` doesn't render a
 * duplicate either) — flagged in the devlog for the productionising
 * engineer to confirm.
 *
 * Submit handler snackbars + closes via `payment-methods.js`.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `method` => normalised payment-method row from the
 *                    payment-methods template (id, brand, last4, expires,
 *                    is_default).
 */

defined( 'ABSPATH' ) || exit;

$method     = isset( $args['method'] ) ? $args['method'] : [];
$method_id  = isset( $method['id'] ) ? (string) $method['id'] : '';
$last4      = isset( $method['last4'] ) ? (string) $method['last4'] : '';
$expires    = isset( $method['expires'] ) ? (string) $method['expires'] : '';
$is_default = ! empty( $method['is_default'] );
$id_prefix  = 'newspack-edit-payment-method__' . $method_id;
$card_mask  = '' !== $last4 ? '•••• •••• •••• ' . $last4 : '';
?>
<div
	id="newspack-my-account__edit-payment-method-<?php echo esc_attr( $method_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account-v2-demo-edit-payment-method"
	data-state="closed"
	data-newspack-my-account-v2-demo="edit-payment-method-modal"
	data-payment-method-id="<?php echo esc_attr( $method_id ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Edit payment method', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content">
			<div class="payment_box payment_method_stripe">
				<p class="form-row form-row-wide">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-card"><?php esc_html_e( 'Card number', 'newspack-plugin' ); ?></label>
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-card"
						class="input-text"
						value="<?php echo esc_attr( $card_mask ); ?>"
						placeholder="<?php esc_attr_e( '1234 1234 1234 1234', 'newspack-plugin' ); ?>"
						autocomplete="off"
					>
				</p>
				<p class="form-row form-row-first">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-exp"><?php esc_html_e( 'Expiry date', 'newspack-plugin' ); ?></label>
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-exp"
						class="input-text"
						value="<?php echo esc_attr( $expires ); ?>"
						placeholder="<?php esc_attr_e( 'MM / YY', 'newspack-plugin' ); ?>"
						autocomplete="off"
					>
				</p>
				<p class="form-row form-row-last">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-cvc"><?php esc_html_e( 'CVC', 'newspack-plugin' ); ?></label>
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-cvc"
						class="input-text"
						placeholder="<?php esc_attr_e( 'CVC', 'newspack-plugin' ); ?>"
						autocomplete="off"
					>
				</p>
				<p class="form-row form-row-wide">
					<label class="checkbox">
						<input
							type="checkbox"
							id="<?php echo esc_attr( $id_prefix ); ?>-default"
							name="<?php echo esc_attr( $id_prefix ); ?>-default"
							class="input-checkbox"
							<?php checked( $is_default ); ?>
							<?php disabled( $is_default ); ?>
						>
						<?php esc_html_e( 'Set as default payment method', 'newspack-plugin' ); ?>
					</label>
				</p>
			</div>

			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3">
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
					data-action="confirm"
				>
					<?php esc_html_e( 'Update payment method', 'newspack-plugin' ); ?>
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
