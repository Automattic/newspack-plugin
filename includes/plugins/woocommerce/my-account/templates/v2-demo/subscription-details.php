<?php
/**
 * My Account v2 prototype — single subscription detail page.
 *
 * One template, five functional variants driven by the data:
 *  - active            (Figma 2636:46149) — Title = product name. Change
 *                       subscription + More dropdown (Update payment /
 *                       Cancel subscription).
 *  - active no fees    (Figma 4351:66807) — same as active, but `fees_covered
 *                       = true` collapses the Amount breakdown to one row.
 *  - cancelled         (Figma 2636:46177) — CANCELLED badge next to title.
 *                       Only "Renew subscription" button. Next payment row
 *                       is em-dash.
 *  - expiring          (Figma 2636:46232) — inline error notice above Amount.
 *                       Only "Renew subscription" button. Next payment em-dash.
 *  - renewed           (Figma 2636:46204) — visually identical to active.
 *
 * Pure newspack-ui composition — see brief §6. Mirrors donation-details.php
 * structurally; differences are subscription-specific labels and the
 * cancellation notice block on the expiring variant.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `data`         => full fake-data array
 *                  - `subscription` => single subscription row from
 *                                      get_fake_subscriptions(), with a
 *                                      `bucket` key set to 'active' or
 *                                      'previous'.
 */

defined( 'ABSPATH' ) || exit;

$data            = isset( $args['data'] ) ? $args['data'] : [];
$subscriptions   = isset( $data['subscriptions'] ) ? $data['subscriptions'] : [];
$currency_symbol = isset( $subscriptions['currency_symbol'] ) ? (string) $subscriptions['currency_symbol'] : '$';
$tiers           = isset( $subscriptions['tiers'] ) ? $subscriptions['tiers'] : [];

$subscription        = isset( $args['subscription'] ) ? $args['subscription'] : [];
$subscription_id     = isset( $subscription['id'] ) ? (string) $subscription['id'] : '';
$subscription_status = isset( $subscription['status'] ) ? (string) $subscription['status'] : '';
$is_active           = 'active' === $subscription_status || 'renewed' === $subscription_status;
$is_cancelled        = 'cancelled' === $subscription_status;
$is_expiring         = 'expiring' === $subscription_status;
$fees_covered        = ! empty( $subscription['fees_covered'] );

$product               = isset( $subscription['product'] ) ? (string) $subscription['product'] : '';
$amount                = isset( $subscription['amount'] ) ? (float) $subscription['amount'] : 0.0;
$frequency             = isset( $subscription['frequency'] ) ? (string) $subscription['frequency'] : '';
$subtotal              = isset( $subscription['subtotal'] ) ? (float) $subscription['subtotal'] : 0.0;
$vat                   = isset( $subscription['vat'] ) ? (float) $subscription['vat'] : 0.0;
$transaction           = isset( $subscription['transaction_fee'] ) ? $subscription['transaction_fee'] : null;
$transaction_label     = isset( $subscription['transaction_fee_label'] ) ? (string) $subscription['transaction_fee_label'] : __( 'Transaction fee', 'newspack-plugin' );
$total                 = isset( $subscription['total'] ) ? (float) $subscription['total'] : $amount;
$payment               = isset( $subscription['payment_method'] ) ? $subscription['payment_method'] : [];
$history               = isset( $subscription['billing_history'] ) ? $subscription['billing_history'] : [];

$list_url = \Newspack\My_Account_UI_V2_Demo::subscriptions_url();

$format_amount = static function ( $a ) use ( $currency_symbol ) {
	return $currency_symbol . number_format_i18n( (float) $a, 2 );
};
$format_date   = static function ( $iso ) {
	if ( empty( $iso ) ) {
		return '';
	}
	$ts = strtotime( $iso );
	if ( ! $ts ) {
		return (string) $iso;
	}
	return date_i18n( 'F j, Y', $ts );
};
$status_label = static function ( $s ) {
	switch ( $s ) {
		case 'paid':
			return __( 'Paid', 'newspack-plugin' );
		case 'cancelled':
			return __( 'Cancelled', 'newspack-plugin' );
		case 'expired':
			return __( 'Expired', 'newspack-plugin' );
		case 'failed':
			return __( 'Failed', 'newspack-plugin' );
		case 'processing':
			return __( 'Processing', 'newspack-plugin' );
		case 'refunded':
			return __( 'Refunded', 'newspack-plugin' );
		default:
			return ucfirst( (string) $s );
	}
};

// Header title is the product name (Figma uses "Member" / "Patron"), with a
// CANCELLED badge appended for the cancelled variant. Reserved-globals trap:
// don't reuse PHP's $title.
$header_title = $product;

// Total label used in the Amount breakdown footer + the no-fees collapsed
// row. Recurring subscriptions always have a frequency; the / unit suffix
// makes sense unconditionally.
$total_amount = $format_amount( $total > 0 ? $total : $amount );
if ( $frequency ) {
	/* translators: %1$s: amount with currency, %2$s: frequency unit (year, month). */
	$total_label = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $total_amount, $frequency );
} else {
	$total_label = $total_amount;
}
?>
<div
	class="newspack-my-account__v2-demo-subscription-details"
	data-newspack-my-account-v2-demo="subscription-details"
	data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
	data-subscription-status="<?php echo esc_attr( $subscription_status ); ?>"
>
	<header class="newspack-my-account__subscription--header">
		<div class="newspack-my-account__subscription--title">
			<a
				href="<?php echo esc_url( $list_url ); ?>"
				class="newspack-my-account__subscription--back-link newspack-ui__button newspack-ui__button--ghost newspack-ui__button--icon newspack-ui__button--small"
				title="<?php esc_attr_e( 'Back to all subscriptions', 'newspack-plugin' ); ?>"
			>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'chevronLeft' ); ?>
			</a>
			<h2 class="newspack-ui__font--m">
				<?php echo esc_html( $header_title ); ?>
			</h2>
			<?php if ( $is_cancelled ) : ?>
				<span class="newspack-ui__badge newspack-ui__badge--error">
					<?php esc_html_e( 'Cancelled', 'newspack-plugin' ); ?>
				</span>
			<?php endif; ?>
		</div>
		<div class="newspack-my-account__subscription--actions">
			<div class="newspack-my-account__subscription--actions-container">
				<?php if ( $is_active ) : ?>
					<a
						href="#"
						class="wcs-switch-link newspack-ui__button newspack-ui__button--secondary newspack-my-account__subscription--change-subscription-item"
						data-action="change-subscription"
						data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
					>
						<?php esc_html_e( 'Change subscription', 'newspack-plugin' ); ?>
					</a>
					<a
						href="#"
						class="newspack-ui__button newspack-my-account__subscription--action-link change_payment_method newspack-ui__button--secondary"
						data-action="update-payment-method"
						data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
					>
						<?php esc_html_e( 'Update payment method', 'newspack-plugin' ); ?>
					</a>
					<a
						href="#"
						class="newspack-ui__button newspack-my-account__subscription--action-link cancel newspack-ui__button--outline newspack-ui__button--destructive"
						data-action="cancel-subscription"
						data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
					>
						<?php esc_html_e( 'Cancel subscription', 'newspack-plugin' ); ?>
					</a>
				<?php elseif ( $is_cancelled || $is_expiring ) : ?>
					<a
						href="#"
						class="newspack-ui__button newspack-my-account__subscription--action-link resubscribe newspack-ui__button--secondary"
						data-action="renew-subscription"
						data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
					>
						<?php esc_html_e( 'Renew subscription', 'newspack-plugin' ); ?>
					</a>
				<?php endif; ?>
			</div>
			<?php if ( $is_active ) : ?>
				<div class="newspack-ui__dropdown newspack-my-account__subscription--actions-dropdown">
					<button class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--small newspack-ui__dropdown__toggle" type="button">
						<span><?php esc_html_e( 'More', 'newspack-plugin' ); ?></span>
						<?php \Newspack\Newspack_UI_Icons::print_svg( 'more' ); ?>
					</button>
					<div class="newspack-ui__dropdown__content">
						<ul>
							<li>
								<a
									href="#"
									class="newspack-ui__button newspack-ui__button--ghost change_payment_method"
									data-action="update-payment-method"
									data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
								>
									<?php esc_html_e( 'Update payment method', 'newspack-plugin' ); ?>
								</a>
							</li>
							<li>
								<a
									href="#"
									class="newspack-ui__button newspack-ui__button--ghost cancel newspack-ui__button--destructive"
									data-action="cancel-subscription"
									data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
								>
									<?php esc_html_e( 'Cancel subscription', 'newspack-plugin' ); ?>
								</a>
							</li>
						</ul>
					</div>
				</div>
			<?php endif; ?>
		</div>
	</header>

	<?php if ( $is_expiring ) : ?>
		<?php $expiry_date = ! empty( $subscription['expires_on'] ) ? $format_date( $subscription['expires_on'] ) : ''; ?>
		<div class="newspack-ui__notice newspack-ui__notice--error">
			<?php
			if ( $expiry_date ) {
				echo wp_kses(
					sprintf(
						/* translators: 1: subscription expiry date in <strong>; 2: opening "renew now" anchor; 3: closing anchor. */
						__( 'Your subscription has been cancelled. Subscription remains active until %1$s. For uninterrupted service, %2$srenew now%3$s.', 'newspack-plugin' ),
						'<strong>' . esc_html( $expiry_date ) . '</strong>',
						'<a href="#" data-action="renew-subscription" data-subscription-id="' . esc_attr( $subscription_id ) . '">',
						'</a>'
					),
					[
						'strong' => [],
						'a'      => [
							'href'                 => true,
							'data-action'          => true,
							'data-subscription-id' => true,
						],
					]
				);
			} else {
				esc_html_e( 'Your subscription has been cancelled.', 'newspack-plugin' );
			}
			?>
		</div>
	<?php endif; ?>

	<?php
	/*
	 * Amount section. Mirrors v1's `<table class="shop_table order_details">`
	 * shape (so v1's _subscriptions.scss styling applies for free) but uses
	 * the Figma's content: "Amount" as the thead heading, breakdown rows in
	 * tbody (no line-item row, no `× 1` quantity), Total row marked
	 * `class="order-total"` with a bold value. Labels are unsuffixed (Figma
	 * "Subtotal" not "Subtotal:") so we skip the WC `get_order_item_totals`
	 * label format here — fake data is the source of truth.
	 */
	?>
	<table class="shop_table order_details">
		<thead>
			<tr>
				<th class="product-name" colspan="2"><?php esc_html_e( 'Amount', 'newspack-plugin' ); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php if ( $fees_covered ) : ?>
				<tr class="order-total">
					<th scope="row"><?php esc_html_e( 'Total', 'newspack-plugin' ); ?></th>
					<td><strong><?php echo esc_html( $total_label ); ?></strong></td>
				</tr>
			<?php else : ?>
				<tr>
					<th scope="row"><?php esc_html_e( 'Subscription', 'newspack-plugin' ); ?></th>
					<td><?php echo esc_html( $format_amount( $subtotal ) ); ?></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Subtotal', 'newspack-plugin' ); ?></th>
					<td><?php echo esc_html( $format_amount( $subtotal ) ); ?></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'VAT', 'newspack-plugin' ); ?></th>
					<td><?php echo esc_html( $format_amount( $vat ) ); ?></td>
				</tr>
				<?php if ( null !== $transaction ) : ?>
					<tr>
						<th scope="row"><?php echo esc_html( $transaction_label ); ?></th>
						<td><?php echo esc_html( $format_amount( $transaction ) ); ?></td>
					</tr>
				<?php endif; ?>
				<tr class="order-total">
					<th scope="row"><?php esc_html_e( 'Total', 'newspack-plugin' ); ?></th>
					<td><strong><?php echo esc_html( $total_label ); ?></strong></td>
				</tr>
			<?php endif; ?>
		</tbody>
	</table>

	<table class="shop_table subscription_details">
		<tbody>
			<?php if ( ! empty( $subscription['started'] ) ) : ?>
				<tr>
					<td><?php esc_html_e( 'First payment', 'newspack-plugin' ); ?></td>
					<td><?php echo esc_html( $format_date( $subscription['started'] ) ); ?></td>
				</tr>
			<?php endif; ?>
			<?php if ( ! empty( $subscription['latest_payment'] ) ) : ?>
				<tr>
					<td><?php esc_html_e( 'Latest payment', 'newspack-plugin' ); ?></td>
					<td><?php echo esc_html( $format_date( $subscription['latest_payment'] ) ); ?></td>
				</tr>
			<?php endif; ?>
			<tr>
				<td><?php esc_html_e( 'Next payment', 'newspack-plugin' ); ?></td>
				<td>
					<?php
					echo esc_html(
						! empty( $subscription['next_payment'] )
							? $format_date( $subscription['next_payment'] )
							: '—'
					);
					?>
				</td>
			</tr>
			<?php if ( ! empty( $payment ) ) : ?>
				<tr>
					<td><?php esc_html_e( 'Payment method', 'newspack-plugin' ); ?></td>
					<td>
						<span class="subscription-payment-method">
							<?php
							/* translators: %1$s: card brand, %2$s: last four digits of card number. */
							echo esc_html( sprintf( __( '%1$s ending in %2$s', 'newspack-plugin' ), isset( $payment['brand'] ) ? $payment['brand'] : '', isset( $payment['last4'] ) ? $payment['last4'] : '' ) );
							?>
						</span>
						<?php if ( ! empty( $payment['exp'] ) ) : ?>
							<br>
							<small>
								<?php
								/* translators: %s: card expiry, e.g. 02/27. */
								echo esc_html( sprintf( __( 'Exp. %s', 'newspack-plugin' ), $payment['exp'] ) );
								?>
							</small>
						<?php endif; ?>
					</td>
				</tr>
			<?php endif; ?>
		</tbody>
	</table>

	<?php if ( ! empty( $history ) ) : ?>
		<section data-section-id="billing-history">
			<header>
				<h2><?php esc_html_e( 'Billing history', 'newspack-plugin' ); ?></h2>
			</header>
			<table class="shop_table shop_table_responsive my_account_orders woocommerce-orders-table woocommerce-MyAccount-orders woocommerce-orders-table--orders">
				<thead>
					<tr>
						<th class="order-number woocommerce-orders-table__header woocommerce-orders-table__header-order-number"><span class="nobr"><?php esc_html_e( 'Order', 'newspack-plugin' ); ?></span></th>
						<th class="order-date woocommerce-orders-table__header woocommerce-orders-table__header-order-date"><span class="nobr"><?php esc_html_e( 'Date', 'newspack-plugin' ); ?></span></th>
						<th class="order-status woocommerce-orders-table__header woocommerce-orders-table__header-order-status"><span class="nobr"><?php esc_html_e( 'Status', 'newspack-plugin' ); ?></span></th>
						<th class="order-total woocommerce-orders-table__header woocommerce-orders-table__header-order-total"><span class="nobr"><?php esc_html_e( 'Total', 'newspack-plugin' ); ?></span></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $history as $h ) : ?>
						<?php $row_status = isset( $h['status'] ) ? (string) $h['status'] : ''; ?>
						<tr class="order woocommerce-orders-table__row woocommerce-orders-table__row--status-<?php echo esc_attr( $row_status ); ?>">
							<td class="order-number woocommerce-orders-table__cell woocommerce-orders-table__cell-order-number" data-title="<?php esc_attr_e( 'Order Number', 'newspack-plugin' ); ?>">
								<?php echo esc_html( isset( $h['order'] ) ? $h['order'] : '' ); ?>
							</td>
							<td class="order-date woocommerce-orders-table__cell woocommerce-orders-table__cell-order-date" data-title="<?php esc_attr_e( 'Date', 'newspack-plugin' ); ?>">
								<?php echo esc_html( $format_date( isset( $h['date'] ) ? $h['date'] : '' ) ); ?>
							</td>
							<td class="order-status woocommerce-orders-table__cell woocommerce-orders-table__cell-order-status" data-title="<?php esc_attr_e( 'Status', 'newspack-plugin' ); ?>">
								<span class="newspack-my-account__subscription--order-status-label <?php echo esc_attr( $row_status ); ?>"></span>
								<?php echo esc_html( $status_label( $row_status ) ); ?>
							</td>
							<td class="order-total woocommerce-orders-table__cell woocommerce-orders-table__cell-order-total" data-title="<?php esc_attr_e( 'Total', 'newspack-plugin' ); ?>">
								<?php
								echo esc_html(
									( ! isset( $h['amount'] ) || null === $h['amount'] )
										? '—'
										: $format_amount( $h['amount'] )
								);
								?>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</section>
	<?php endif; ?>
</div>

<?php
$reader        = isset( $data['reader'] ) ? $data['reader'] : [];
$reader_email  = isset( $reader['email'] ) ? (string) $reader['email'] : '';
$tiers_billing = isset( $tiers['billing'] ) ? $tiers['billing'] : [];

// Change subscription modal — rendered only for the active/renewed states
// that show the Change subscription button. Cancelled/expiring subs offer
// Renew instead, and don't need the tier picker.
if ( $is_active && ! empty( $tiers ) ) {
	load_template(
		__DIR__ . '/partials/change-subscription-modal.php',
		false,
		[
			'tiers'           => $tiers,
			'subscription'    => $subscription,
			'currency_symbol' => $currency_symbol,
		]
	);
}

// Cancel subscription modal — rendered for any sub that exposes a Cancel
// trigger (active / renewed via the More dropdown; expiring inherits the
// header link too). Cancelled subs already terminated; no Cancel for them.
if ( $is_active || $is_expiring ) {
	load_template(
		__DIR__ . '/partials/cancel-subscription-modal.php',
		false,
		[
			'subscription' => $subscription,
			'reader_email' => $reader_email,
		]
	);
}

// Renew subscription modal — rendered for cancelled / expiring subs (the
// header Renew button) and reused by the expiring variant's inline
// "renew now" anchor inside the error notice.
if ( $is_cancelled || $is_expiring ) {
	load_template(
		__DIR__ . '/partials/renew-subscription-modal.php',
		false,
		[
			'subscription'    => $subscription,
			'billing'         => $tiers_billing,
			'currency_symbol' => $currency_symbol,
			'reader_email'    => $reader_email,
		]
	);
}
?>
