<?php
/**
 * My Account v2 prototype — Delete payment method modal partial.
 *
 * Targets Figma frame `2636:45461` (Delete payment method). Per-card
 * instance — modal id `newspack-my-account__delete-payment-method-<id>`.
 * Confirmation pattern mirrors v1's `delete_payment_method_modals` (in
 * `class-my-account-ui-v1.php`): "Are you sure?" prose + a card preview
 * (Brand / Ending in / Exp.) + destructive Delete + ghost Cancel.
 *
 * Submit handler snackbars + closes via `payment-methods.js`. No success
 * step — the snackbar is the confirmation, matching the cancel-donation
 * "snackbar-only" call in Phase 5 for actions Figma doesn't pin a success
 * frame on.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `method` => normalised payment-method row (id, brand,
 *                    last4, expires).
 */

defined( 'ABSPATH' ) || exit;

$method    = isset( $args['method'] ) ? $args['method'] : [];
$method_id = isset( $method['id'] ) ? (string) $method['id'] : '';
$brand     = isset( $method['brand'] ) ? (string) $method['brand'] : '';
$last4     = isset( $method['last4'] ) ? (string) $method['last4'] : '';
$expires   = isset( $method['expires'] ) ? (string) $method['expires'] : '';

$preview_lines = [];
if ( '' !== $brand ) {
	$preview_lines[] = \wc_get_credit_card_type_label( $brand );
}
if ( '' !== $last4 ) {
	$preview_lines[] = sprintf(
		/* translators: %s: last 4 digits of the card. */
		__( 'Ending in %s', 'newspack-plugin' ),
		$last4
	);
}
if ( '' !== $expires ) {
	$preview_lines[] = sprintf(
		/* translators: %s: card expiration date in MM/YY. */
		__( 'Exp. %s', 'newspack-plugin' ),
		$expires
	);
}
?>
<div
	id="newspack-my-account__delete-payment-method-<?php echo esc_attr( $method_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account-v2-demo-delete-payment-method"
	data-state="closed"
	data-newspack-my-account-v2-demo="delete-payment-method-modal"
	data-payment-method-id="<?php echo esc_attr( $method_id ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Delete payment method', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content">
			<p>
				<?php esc_html_e( 'Are you sure you want to delete this payment method from your account?', 'newspack-plugin' ); ?>
			</p>
			<?php if ( ! empty( $preview_lines ) ) : ?>
				<div class="payment-method-preview newspack-ui__font--s newspack-ui__font--bold">
					<?php echo esc_html( implode( "\n", $preview_lines ) ); ?>
				</div>
			<?php endif; ?>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--destructive newspack-ui__button--wide"
				data-action="confirm"
			>
				<?php esc_html_e( 'Delete payment method', 'newspack-plugin' ); ?>
			</button>
			<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
				<?php esc_html_e( 'Cancel', 'newspack-plugin' ); ?>
			</button>
		</div>
	</div>
</div>
