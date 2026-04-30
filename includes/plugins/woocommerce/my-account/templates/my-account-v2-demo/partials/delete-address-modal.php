<?php
/**
 * My Account v2 prototype — Delete address modal partial.
 *
 * Targets Figma frame `2636:45464` (Delete address). Per-address-type —
 * modal id `newspack-my-account__delete-address-<billing|shipping>`.
 * Mirrors the Delete payment method modal pattern: "Are you sure?" +
 * address preview (multi-line) + destructive Delete + ghost Cancel.
 *
 * Submit handler snackbars + closes via `payment-methods.js`.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `address_type`  => 'billing' | 'shipping'
 *                  - `address_label` => display label for the type
 *                  - `address`       => populated address row.
 */

defined( 'ABSPATH' ) || exit;

$address_type  = isset( $args['address_type'] ) ? (string) $args['address_type'] : '';
$address_label = isset( $args['address_label'] ) ? (string) $args['address_label'] : '';
$address       = isset( $args['address'] ) && is_array( $args['address'] ) ? $args['address'] : [];

if ( '' === $address_type || empty( $address ) ) {
	return;
}

$lines = isset( $address['lines'] ) && is_array( $address['lines'] ) ? $address['lines'] : [];
?>
<div
	id="newspack-my-account__delete-address-<?php echo esc_attr( $address_type ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account-v2-demo-delete-address"
	data-state="closed"
	data-newspack-my-account-v2-demo="delete-address-modal"
	data-address-type="<?php echo esc_attr( $address_type ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2>
				<?php
				printf(
					/* translators: %s: address type (billing, shipping). */
					esc_html__( 'Delete %s address', 'newspack-plugin' ),
					esc_html( strtolower( $address_label ) )
				);
				?>
			</h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content">
			<p>
				<?php esc_html_e( 'Are you sure you want to delete this address from your account?', 'newspack-plugin' ); ?>
			</p>
			<?php if ( ! empty( $lines ) ) : ?>
				<div class="address-preview newspack-ui__font--s newspack-ui__font--bold">
					<?php echo esc_html( implode( "\n", $lines ) ); ?>
				</div>
			<?php endif; ?>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--destructive newspack-ui__button--wide"
				data-action="confirm"
			>
				<?php esc_html_e( 'Delete address', 'newspack-plugin' ); ?>
			</button>
			<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
				<?php esc_html_e( 'Cancel', 'newspack-plugin' ); ?>
			</button>
		</div>
	</div>
</div>
