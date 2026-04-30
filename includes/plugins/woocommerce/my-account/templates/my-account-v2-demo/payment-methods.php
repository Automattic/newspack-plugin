<?php
/**
 * My Account v2 prototype — Payment information endpoint.
 *
 * Targets Figma frame `2636:45349` (PAYMENT INFORMATION). Mirrors v1's
 * `templates/v1/payment-information.php` DOM verbatim per brief §2.1.1:
 * `<section id="payment-methods">` + a `.newspack-ui__row` grid of
 * `.newspack-ui__box.--border.payment-method` cards, then `<section
 * id="addresses">` with the same card pattern for billing / shipping.
 * Existing v1 SCSS (`src/my-account/v1/style.scss`,
 * `src/newspack-ui/scss/elements/woocommerce/_my-account.scss`) paints
 * both surfaces — no scoped SCSS needed in `style.scss`.
 *
 * Reverses the Phase 6 call to use WC core's
 * `account-payment-methods-table`. Devlog entry "Payment information
 * rebuild" tracks the rationale.
 *
 * Saved methods + addresses come from `$args['data']` (the fake-data
 * slice). Action triggers carry v1's hook classes (`newspack-my-account__
 * delete-payment-method`, `…__edit-address`, etc.) plus a `data-payment-
 * method` / `data-address-type` attribute the JS dispatcher reads to open
 * the matching modal partial loaded at the bottom of this template.
 *
 * @package Newspack
 * @var array $args Template args; expected to contain `data` => fake-data array.
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

$data            = isset( $args['data'] ) ? $args['data'] : [];
$payment_methods = isset( $data['payment_methods'] ) ? $data['payment_methods'] : [];
$saved_methods   = isset( $payment_methods['cc'] ) && is_array( $payment_methods['cc'] ) ? $payment_methods['cc'] : [];
$has_methods     = ! empty( $saved_methods );
$columns         = \wc_get_account_payment_methods_columns();
$addresses       = isset( $data['addresses'] ) && is_array( $data['addresses'] ) ? $data['addresses'] : [];
$reader          = isset( $data['reader'] ) ? $data['reader'] : [];
$reader_email    = isset( $reader['email'] ) ? (string) $reader['email'] : '';

// Build a flat list of saved methods keyed by a stable id so the
// dispatcher and per-card modals can address them uniformly. Pattern
// matches the prior table's `<type>-<index>` id (`cc-0`, `cc-1`).
$method_rows = [];
foreach ( $saved_methods as $method_index => $method ) {
	$method_id     = 'cc-' . (int) $method_index;
	$method_brand  = isset( $method['method']['brand'] ) ? (string) $method['method']['brand'] : '';
	$method_last4  = isset( $method['method']['last4'] ) ? (string) $method['method']['last4'] : '';
	$method_exp    = isset( $method['expires'] ) ? (string) $method['expires'] : '';
	$method_is_def = ! empty( $method['is_default'] );

	// Mirror v1's `payment-information.php` parse-and-compare so a
	// malformed `MM/YY` (e.g. `02/ab`) doesn't silently cast to year 20
	// and trip the comparison. Only flag expired when the parse
	// succeeded and the month is in the past.
	$method_expired = false;
	if ( '' !== $method_exp ) {
		$parsed_exp = date_parse_from_format( 'n/y', $method_exp );
		if (
			is_array( $parsed_exp )
			&& empty( $parsed_exp['errors'] )
			&& ! empty( $parsed_exp['year'] )
			&& ! empty( $parsed_exp['month'] )
		) {
			$exp_year  = (int) $parsed_exp['year'];
			$exp_month = (int) $parsed_exp['month'];
			$now_year  = (int) gmdate( 'Y' );
			$now_month = (int) gmdate( 'm' );
			if ( $exp_year < $now_year || ( $exp_year === $now_year && $exp_month < $now_month ) ) {
				$method_expired = true;
			}
		}
	}

	$method_rows[] = [
		'id'         => $method_id,
		'brand'      => $method_brand,
		'last4'      => $method_last4,
		'expires'    => $method_exp,
		'is_default' => $method_is_def,
		'is_expired' => $method_expired,
		'actions'    => isset( $method['actions'] ) && is_array( $method['actions'] ) ? $method['actions'] : [],
	];
}

\do_action( 'newspack_woocommerce_before_account_payment_methods', $has_methods );
?>

<section id="payment-methods">
	<h4 class="newspack-ui__font--m newspack-ui__spacing-top--0"><?php \esc_html_e( 'Payment methods', 'newspack-plugin' ); ?></h4>

	<?php if ( $has_methods ) : ?>

		<div class="newspack-my-account__payment-methods newspack-ui__row newspack-ui__row--no-padding">
			<?php foreach ( $method_rows as $method_row ) : ?>
				<div
					class="newspack-ui__box newspack-ui__box--border payment-method<?php echo $method_row['is_default'] ? ' default-payment-method' : ''; ?>"
					data-payment-method="<?php echo \esc_attr( $method_row['id'] ); ?>"
				>
					<div class="payment-method__content">
						<h3 class="newspack-ui__font--s">
							<strong><?php echo \esc_html( \wc_get_credit_card_type_label( $method_row['brand'] ) ); ?></strong>
						</h3>
						<?php if ( '' !== $method_row['last4'] ) : ?>
							<p class="newspack-ui__font--s">
								<?php
								printf(
									/* translators: last 4 digits of the card. */
									\esc_html__( 'Ending in %s', 'newspack-plugin' ),
									\esc_html( $method_row['last4'] )
								);
								?>
							</p>
						<?php endif; ?>
						<?php if ( '' !== $method_row['expires'] ) : ?>
							<p class="newspack-ui__font--s">
								<?php
								printf(
									/* translators: %s: card expiration date in MM/YY. */
									\esc_html__( 'Exp. %s', 'newspack-plugin' ),
									\esc_html( $method_row['expires'] )
								);
								?>
							</p>
						<?php endif; ?>
					</div>
					<div class="newspack-ui__box__actions">
						<?php if ( $method_row['is_expired'] || $method_row['is_default'] ) : ?>
							<div class="newspack-ui__box__badges">
								<?php if ( $method_row['is_expired'] ) : ?>
									<span class="newspack-ui__badge newspack-ui__badge--secondary"><?php \esc_html_e( 'Expired', 'newspack-plugin' ); ?></span>
								<?php endif; ?>
								<?php if ( $method_row['is_default'] ) : ?>
									<span class="newspack-ui__badge newspack-ui__badge--secondary"><?php \esc_html_e( 'Default', 'newspack-plugin' ); ?></span>
								<?php endif; ?>
							</div>
						<?php endif; ?>
						<div class="newspack-ui__dropdown">
							<button class="newspack-ui__dropdown__toggle newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__button--small" type="button">
								<?php Newspack_UI_Icons::print_svg( 'more' ); ?>
								<span class="screen-reader-text"><?php \esc_html_e( 'More', 'newspack-plugin' ); ?></span>
							</button>
							<div class="newspack-ui__dropdown__content">
								<ul>
									<?php
									ksort( $method_row['actions'] );
									foreach ( $method_row['actions'] as $action_key => $action_data ) :
										$action_label = isset( $action_data['name'] ) ? (string) $action_data['name'] : '';
										if ( '' === $action_label ) {
											continue;
										}
										$is_delete  = ( 'delete' === $action_key || 'wcs_deletion_error' === $action_key );
										$is_default = ( 'default' === $action_key );
										if ( $is_delete ) {
											// Force the canonical label even when the
											// action map carries a shorter name (e.g.
											// "Delete") — matches the modal title.
											$action_label = __( 'Delete payment method', 'newspack-plugin' );
										}
										$action_class = 'newspack-ui__button newspack-ui__button--ghost ' . \sanitize_html_class( $action_key );
										if ( $is_delete ) {
											$action_class .= ' newspack-my-account__delete-payment-method';
										} elseif ( ! $is_default ) {
											// Edit isn't currently emitted by the
											// fake-data action map, but if the v1 shape
											// adds it later this branch wires it
											// without further changes.
											$action_class .= ' newspack-my-account__edit-payment-method';
										}
										?>
										<li>
											<a
												href="#"
												class="<?php echo \esc_attr( $action_class ); ?>"
												data-payment-method="<?php echo \esc_attr( $method_row['id'] ); ?>"
											>
												<?php echo \esc_html( $action_label ); ?>
											</a>
										</li>
									<?php endforeach; ?>
									<li>
										<a
											href="#"
											class="newspack-ui__button newspack-ui__button--ghost edit newspack-my-account__edit-payment-method"
											data-payment-method="<?php echo \esc_attr( $method_row['id'] ); ?>"
										>
											<?php \esc_html_e( 'Edit payment method', 'newspack-plugin' ); ?>
										</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			<?php endforeach; ?>
		</div>

	<?php else : ?>

		<p>
			<?php \esc_html_e( 'You don’t have any payment methods saved yet.', 'newspack-plugin' ); ?>
		</p>

	<?php endif; ?>

	<?php \do_action( 'newspack_woocommerce_after_account_payment_methods', $has_methods ); ?>

	<a
		class="newspack-ui__button newspack-ui__button--primary newspack-my-account__add-payment-method"
		href="#"
	>
		<?php \esc_html_e( 'Add payment method', 'newspack-plugin' ); ?>
	</a>
</section>

<?php
// Address types follow v1's gating: shipping only when WC ships separately
// from billing. Filter parity with v1's `payment-information.php` lets any
// production-shaped site contribute extra address types.
$address_types = [ 'billing' => __( 'Billing', 'newspack-plugin' ) ];
if ( ! \wc_ship_to_billing_address_only() && \wc_shipping_enabled() ) {
	$address_types['shipping'] = __( 'Shipping', 'newspack-plugin' );
}
$address_types       = \apply_filters( 'woocommerce_my_account_get_addresses', $address_types );
$populated_addresses = [];
foreach ( $address_types as $address_type => $address_label ) {
	if ( ! empty( $addresses[ $address_type ] ) ) {
		$populated_addresses[ $address_type ] = $addresses[ $address_type ];
	}
}
$addresses_to_add = array_diff( array_keys( $address_types ), array_keys( $populated_addresses ) );
?>

<section id="addresses">
	<h4 class="newspack-ui__font--m"><?php \esc_html_e( 'Addresses', 'newspack-plugin' ); ?></h4>

	<?php if ( ! empty( $populated_addresses ) ) : ?>
		<div class="newspack-my-account__addresses newspack-ui__row newspack-ui__row--no-padding">
			<?php
			foreach ( $populated_addresses as $address_type => $address ) :
				$address_lines = isset( $address['lines'] ) && is_array( $address['lines'] ) ? $address['lines'] : [];
				$is_default    = ! empty( $address['is_default'] );
				?>
				<div
					class="newspack-ui__box newspack-ui__box--border woocommerce-Address"
					data-address-type="<?php echo \esc_attr( $address_type ); ?>"
				>
					<div class="address__content">
						<address class="newspack-ui__font--s">
							<?php echo \esc_html( implode( "\n", $address_lines ) ); ?>
						</address>
					</div>
					<div class="newspack-ui__box__actions">
						<?php if ( $is_default ) : ?>
							<div class="newspack-ui__box__badges">
								<span class="newspack-ui__badge newspack-ui__badge--secondary"><?php \esc_html_e( 'Default', 'newspack-plugin' ); ?></span>
							</div>
						<?php endif; ?>
						<div class="newspack-ui__dropdown">
							<button class="newspack-ui__dropdown__toggle newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__button--small" type="button">
								<?php Newspack_UI_Icons::print_svg( 'more' ); ?>
								<span class="screen-reader-text"><?php \esc_html_e( 'More', 'newspack-plugin' ); ?></span>
							</button>
							<div class="newspack-ui__dropdown__content">
								<ul>
									<li>
										<a
											href="#"
											class="newspack-ui__button newspack-ui__button--ghost edit newspack-my-account__edit-address"
											data-address-type="<?php echo \esc_attr( $address_type ); ?>"
										>
											<?php \esc_html_e( 'Edit', 'newspack-plugin' ); ?>
										</a>
									</li>
									<li>
										<a
											href="#"
											class="newspack-ui__button newspack-ui__button--ghost delete newspack-my-account__delete-address"
											data-address-type="<?php echo \esc_attr( $address_type ); ?>"
										>
											<?php \esc_html_e( 'Delete address', 'newspack-plugin' ); ?>
										</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
	<?php else : ?>
		<p>
			<?php \esc_html_e( 'You don’t have any addresses saved yet.', 'newspack-plugin' ); ?>
		</p>
	<?php endif; ?>

	<?php if ( ! empty( $addresses_to_add ) ) : ?>
		<div class="newspack-ui__button__row">
			<?php foreach ( $addresses_to_add as $address_type ) : ?>
				<a
					href="#"
					class="newspack-ui__button newspack-ui__button--primary newspack-my-account__edit-address"
					data-address-type="<?php echo \esc_attr( $address_type ); ?>"
				>
					<?php
					printf(
						/* translators: %s: address type (billing, shipping). */
						\esc_html__( 'Add %s address', 'newspack-plugin' ),
						\esc_html( $address_type )
					);
					?>
				</a>
			<?php endforeach; ?>
		</div>
	<?php endif; ?>
</section>

<?php
// Modal partials. One add-payment-method singleton + per-card edit/delete +
// per-address-type edit/delete. Loaded after the sections close so internal
// modal clicks don't bubble through to the surrounding wrap (mirrors the
// detail-page modal pattern from Phases 4-5).
load_template(
	__DIR__ . '/partials/add-payment-method-modal.php',
	false,
	[ 'reader_email' => $reader_email ]
);

foreach ( $method_rows as $method_row ) {
	load_template(
		__DIR__ . '/partials/edit-payment-method-modal.php',
		false,
		[ 'method' => $method_row ]
	);
	load_template(
		__DIR__ . '/partials/delete-payment-method-modal.php',
		false,
		[ 'method' => $method_row ]
	);
}

foreach ( $address_types as $address_type => $address_label ) {
	$address_for_type = isset( $addresses[ $address_type ] ) ? $addresses[ $address_type ] : null;
	load_template(
		__DIR__ . '/partials/edit-address-modal.php',
		false,
		[
			'address_type'  => $address_type,
			'address_label' => $address_label,
			'address'       => $address_for_type,
		]
	);
	if ( ! empty( $address_for_type ) ) {
		load_template(
			__DIR__ . '/partials/delete-address-modal.php',
			false,
			[
				'address_type'  => $address_type,
				'address_label' => $address_label,
				'address'       => $address_for_type,
			]
		);
	}
}
