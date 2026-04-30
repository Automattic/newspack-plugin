<?php
/**
 * My Account v2 prototype — Edit / Add address modal partial.
 *
 * Targets Figma frame `2636:45492` (Edit address). One modal partial
 * serves both Edit (when an address is populated) and Add (when the slot
 * is empty) — title flips on `address` presence, matching v1's
 * `add_address_modals` behaviour. Modal id is keyed by address type
 * (`newspack-my-account__edit-address-billing`, `…-shipping`).
 *
 * Form fields mirror Figma's frame: Country/Region select + two Street
 * address inputs + a Town/City + County + Post code row + Set-as-default
 * checkbox. The select is a stub — only the few entries the fake data
 * uses are rendered. Real productionisation routes this to v1's
 * `myaccount/form-edit-address.php` template.
 *
 * Submit handler snackbars + closes via `payment-methods.js`.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `address_type`  => 'billing' | 'shipping'
 *                  - `address_label` => display label for the type
 *                  - `address`       => populated address row, or null for
 *                                       the Add variant.
 */

defined( 'ABSPATH' ) || exit;

$address_type  = isset( $args['address_type'] ) ? (string) $args['address_type'] : '';
$address_label = isset( $args['address_label'] ) ? (string) $args['address_label'] : '';
$address       = isset( $args['address'] ) && is_array( $args['address'] ) ? $args['address'] : null;
$is_existing   = ! empty( $address );

if ( '' === $address_type ) {
	return;
}

$id_prefix = 'newspack-edit-address__' . $address_type;
$values    = [
	'address_1'  => $is_existing && isset( $address['address_1'] ) ? (string) $address['address_1'] : '',
	'address_2'  => $is_existing && isset( $address['address_2'] ) ? (string) $address['address_2'] : '',
	'city'       => $is_existing && isset( $address['city'] ) ? (string) $address['city'] : '',
	'state'      => $is_existing && isset( $address['state'] ) ? (string) $address['state'] : '',
	'postcode'   => $is_existing && isset( $address['postcode'] ) ? (string) $address['postcode'] : '',
	'country'    => $is_existing && isset( $address['country'] ) ? (string) $address['country'] : '',
	'is_default' => $is_existing && ! empty( $address['is_default'] ),
];

if ( $is_existing ) {
	$modal_title = sprintf(
		/* translators: %s: address type (Billing, Shipping). */
		__( 'Edit %s address', 'newspack-plugin' ),
		strtolower( $address_label )
	);
	$cta_label = __( 'Update address', 'newspack-plugin' );
} else {
	$modal_title = sprintf(
		/* translators: %s: address type (Billing, Shipping). */
		__( 'Add %s address', 'newspack-plugin' ),
		strtolower( $address_label )
	);
	$cta_label = __( 'Add address', 'newspack-plugin' );
}

// Minimal country list — enough to round-trip the fake data without
// pulling WC's full country dropdown into the prototype. Order alphabetised
// so the Figma's "United Kingdom" lands near the top of a familiar set.
$countries = [
	'GB' => __( 'United Kingdom', 'newspack-plugin' ),
	'US' => __( 'United States', 'newspack-plugin' ),
	'CA' => __( 'Canada', 'newspack-plugin' ),
	'FR' => __( 'France', 'newspack-plugin' ),
	'DE' => __( 'Germany', 'newspack-plugin' ),
];
?>
<div
	id="newspack-my-account__edit-address-<?php echo esc_attr( $address_type ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account-v2-demo-edit-address"
	data-state="closed"
	data-newspack-my-account-v2-demo="edit-address-modal"
	data-address-type="<?php echo esc_attr( $address_type ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal">
		<header class="newspack-ui__modal__header">
			<h2><?php echo esc_html( $modal_title ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content">
			<div class="payment_box">
				<p class="form-row form-row-wide">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-country"><?php esc_html_e( 'Country / Region', 'newspack-plugin' ); ?></label>
					<select id="<?php echo esc_attr( $id_prefix ); ?>-country" class="input-text">
						<option value=""><?php esc_html_e( 'Select a country / region', 'newspack-plugin' ); ?></option>
						<?php foreach ( $countries as $code => $label ) : ?>
							<option value="<?php echo esc_attr( $code ); ?>" <?php selected( $values['country'], $code ); ?>>
								<?php echo esc_html( $label ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				</p>

				<p class="form-row form-row-wide">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-address-1">
						<?php esc_html_e( 'Street address', 'newspack-plugin' ); ?>
						<abbr class="required" title="required">*</abbr>
					</label>
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-address-1"
						class="input-text"
						value="<?php echo esc_attr( $values['address_1'] ); ?>"
						placeholder="<?php esc_attr_e( 'Street address', 'newspack-plugin' ); ?>"
						autocomplete="off"
					>
				</p>
				<p class="form-row form-row-wide">
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-address-2"
						class="input-text"
						value="<?php echo esc_attr( $values['address_2'] ); ?>"
						placeholder="<?php esc_attr_e( 'Apartment, suite, unit, etc. (optional)', 'newspack-plugin' ); ?>"
						autocomplete="off"
					>
				</p>

				<p class="form-row form-row-first">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-city"><?php esc_html_e( 'Town / City', 'newspack-plugin' ); ?></label>
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-city"
						class="input-text"
						value="<?php echo esc_attr( $values['city'] ); ?>"
						autocomplete="off"
					>
				</p>
				<p class="form-row form-row-first">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-state"><?php esc_html_e( 'County', 'newspack-plugin' ); ?></label>
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-state"
						class="input-text"
						value="<?php echo esc_attr( $values['state'] ); ?>"
						autocomplete="off"
					>
				</p>
				<p class="form-row form-row-last">
					<label for="<?php echo esc_attr( $id_prefix ); ?>-postcode"><?php esc_html_e( 'Post code', 'newspack-plugin' ); ?></label>
					<input
						type="text"
						id="<?php echo esc_attr( $id_prefix ); ?>-postcode"
						class="input-text"
						value="<?php echo esc_attr( $values['postcode'] ); ?>"
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
							<?php checked( $values['is_default'] ); ?>
							<?php disabled( $values['is_default'] ); ?>
						>
						<?php esc_html_e( 'Set as default address', 'newspack-plugin' ); ?>
					</label>
				</p>
			</div>

			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3">
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
					data-action="confirm"
				>
					<?php echo esc_html( $cta_label ); ?>
				</button>
				<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
					<?php esc_html_e( 'Cancel', 'newspack-plugin' ); ?>
				</button>
			</div>
		</div>
	</div>
</div>
