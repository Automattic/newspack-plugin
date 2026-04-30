<?php
/**
 * My Account v2 prototype — single donation detail page.
 *
 * One template, four functional variants driven by the data:
 *  - recurring / active (Figma 2636:46488)
 *    Title = price + frequency. Edit donation + More dropdown
 *    (Update payment method / Cancel donation).
 *  - recurring / cancelled (Figma 2636:46661)
 *    CANCELLED badge next to the title. Only "Restart donation" button.
 *    Next donation row shows an em-dash.
 *  - one-time (Figma 2636:46512)
 *    Title = single amount, no frequency. No top-right buttons.
 *    A single "Donation date" row replaces First/Latest/Next.
 *  - the recurring "no fees" variant (Figma 4339:17740) is expressed as
 *    `fees_covered = true` on the donation, which suppresses the entire
 *    Amount breakdown section — readers in countries without fee taxes
 *    don't see the breakdown row at all.
 *
 * Mirrors `subscription-details.php` shape: v1's
 * `newspack-my-account__subscription--*` header classes plus the v1/WCS
 * canonical `<table class="shop_table order_details">`,
 * `<table class="shop_table subscription_details">`, and
 * `<table class="shop_table … woocommerce-orders-table--orders">` table
 * shapes — all painted for free by the body class chain
 * (`.woocommerce-account.newspack-my-account.newspack-ui`). See brief §2.1.1.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `data`     => full fake-data array
 *                  - `donation` => single donation row from get_fake_donations(),
 *                                  with a `kind` key set to 'recurring' or 'one_time'.
 */

defined( 'ABSPATH' ) || exit;

$data            = isset( $args['data'] ) ? $args['data'] : [];
$donations       = isset( $data['donations'] ) ? $data['donations'] : [];
$currency_symbol = isset( $donations['currency_symbol'] ) ? (string) $donations['currency_symbol'] : '$';
$donation        = isset( $args['donation'] ) ? $args['donation'] : [];
$kind            = isset( $donation['kind'] ) ? (string) $donation['kind'] : 'recurring';
$donation_status = isset( $donation['status'] ) ? (string) $donation['status'] : '';
$is_recurring    = 'recurring' === $kind;
$is_active       = 'active' === $donation_status;
$is_cancelled    = 'cancelled' === $donation_status;
$fees_covered    = ! empty( $donation['fees_covered'] );

$donation_id = isset( $donation['id'] ) ? (string) $donation['id'] : '';
$amount      = isset( $donation['amount'] ) ? (float) $donation['amount'] : 0.0;
$frequency   = isset( $donation['frequency'] ) ? (string) $donation['frequency'] : '';
$subtotal    = isset( $donation['subtotal'] ) ? (float) $donation['subtotal'] : 0.0;
$vat         = isset( $donation['vat'] ) ? (float) $donation['vat'] : 0.0;
$transaction = isset( $donation['transaction_fee'] ) ? $donation['transaction_fee'] : null;
$total       = isset( $donation['total'] ) ? (float) $donation['total'] : $amount;
$payment     = isset( $donation['payment_method'] ) ? $donation['payment_method'] : [];
$history     = isset( $donation['billing_history'] ) ? $donation['billing_history'] : [];

$list_url = \Newspack\My_Account_V2_Demo::donations_url();

$format_amount = static function ( $a ) use ( $currency_symbol ) {
	return $currency_symbol . number_format_i18n( (float) $a, 2 );
};
$format_date = static function ( $iso ) {
	if ( empty( $iso ) ) {
		return '';
	}
	$ts = strtotime( $iso );
	if ( ! $ts ) {
		return (string) $iso;
	}
	return date_i18n( 'F j, Y', $ts );
};
// Maps WC canonical order statuses to the Figma-side display label. v1's
// `_subscriptions.scss` colours `--order-status-label.<wc-status>` for
// completed/refunded/processing/etc., so the data layer stays on real WC
// status names and the label switch translates to "Paid" / etc.
$status_label = static function ( $s ) {
	switch ( $s ) {
		case 'completed':
			return __( 'Paid', 'newspack-plugin' );
		case 'cancelled':
			return __( 'Cancelled', 'newspack-plugin' );
		case 'expired':
			return __( 'Expired', 'newspack-plugin' );
		case 'refunded':
			return __( 'Refunded', 'newspack-plugin' );
		default:
			return ucfirst( (string) $s );
	}
};

$amount_label = $format_amount( $amount );
if ( $is_recurring && $frequency ) {
	/* translators: %1$s: amount with currency, %2$s: frequency unit (month, year). */
	$header_title = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $amount_label, $frequency );
} else {
	$header_title = $amount_label;
}

// Total label used in the Amount breakdown footer + the no-fees collapsed
// row. Mirrors the subscription-details shape — recurring donations always
// carry a frequency suffix; one-times render the bare amount.
$total_amount = $format_amount( $total > 0 ? $total : $amount );
if ( $is_recurring && $frequency ) {
	/* translators: %1$s: amount with currency, %2$s: frequency unit (month, year). */
	$total_label = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $total_amount, $frequency );
} else {
	$total_label = $total_amount;
}
?>
<div
	class="newspack-my-account-v2-demo-donation-details"
	data-newspack-my-account-v2-demo="donation-details"
	data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
	data-donation-kind="<?php echo esc_attr( $kind ); ?>"
	data-donation-status="<?php echo esc_attr( $donation_status ); ?>"
>
	<header class="newspack-my-account__subscription--header">
		<div class="newspack-my-account__subscription--title">
			<a
				href="<?php echo esc_url( $list_url ); ?>"
				class="newspack-my-account__subscription--back-link newspack-ui__button newspack-ui__button--ghost newspack-ui__button--icon newspack-ui__button--small"
				title="<?php esc_attr_e( 'Back to all donations', 'newspack-plugin' ); ?>"
			>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'chevronLeft' ); ?>
			</a>
			<h2 class="newspack-ui__font--m">
				<?php echo esc_html( $header_title ); ?>
			</h2>
			<?php if ( $is_recurring && $is_cancelled ) : ?>
				<span class="newspack-ui__badge newspack-ui__badge--error">
					<?php esc_html_e( 'Cancelled', 'newspack-plugin' ); ?>
				</span>
			<?php endif; ?>
		</div>
		<div class="newspack-my-account__subscription--actions">
			<div class="newspack-my-account__subscription--actions-container">
				<?php if ( $is_recurring && $is_active ) : ?>
					<?php // Edit donation stays flat-visible next to More — no `--action-link` class so v1's desktop hide rule doesn't fire. Mirrors subscription's Change subscription. ?>
					<a
						href="#"
						class="newspack-ui__button newspack-ui__button--secondary"
						data-action="modify-donation"
						data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
					>
						<?php esc_html_e( 'Edit donation', 'newspack-plugin' ); ?>
					</a>
					<a
						href="#"
						class="newspack-ui__button newspack-my-account__subscription--action-link change_payment_method newspack-ui__button--secondary"
						data-action="update-payment-method"
						data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
					>
						<?php esc_html_e( 'Update payment method', 'newspack-plugin' ); ?>
					</a>
					<a
						href="#"
						class="newspack-ui__button newspack-my-account__subscription--action-link cancel newspack-ui__button--outline newspack-ui__button--destructive"
						data-action="cancel-donation"
						data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
					>
						<?php esc_html_e( 'Cancel donation', 'newspack-plugin' ); ?>
					</a>
				<?php elseif ( $is_recurring && $is_cancelled ) : ?>
					<?php // Restart donation stays flat-visible — no `--action-link` class so v1's desktop hide rule doesn't fire. Mirrors Edit donation. ?>
					<a
						href="#"
						class="newspack-ui__button newspack-ui__button--secondary resubscribe"
						data-action="restart-donation"
						data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
					>
						<?php esc_html_e( 'Restart donation', 'newspack-plugin' ); ?>
					</a>
				<?php endif; ?>
			</div>
			<?php if ( $is_recurring && $is_active ) : ?>
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
									data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
								>
									<?php esc_html_e( 'Update payment method', 'newspack-plugin' ); ?>
								</a>
							</li>
							<li>
								<a
									href="#"
									class="newspack-ui__button newspack-ui__button--ghost cancel newspack-ui__button--destructive"
									data-action="cancel-donation"
									data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
								>
									<?php esc_html_e( 'Cancel donation', 'newspack-plugin' ); ?>
								</a>
							</li>
						</ul>
					</div>
				</div>
			<?php endif; ?>
		</div>
	</header>

	<?php
	/*
	 * Amount section. Mirrors subscription-details.php — Figma's "Amount"
	 * heading lives in <thead>, breakdown rows in <tbody>, the Total row
	 * carries `class="order-total"` so v1's _subscriptions.scss bolds it
	 * and pads it correctly. fees_covered = true collapses to a single
	 * Total row (Figma 4339:17740).
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
					<th scope="row"><?php esc_html_e( 'Donation', 'newspack-plugin' ); ?></th>
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
						<th scope="row"><?php esc_html_e( 'Transaction fee', 'newspack-plugin' ); ?></th>
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
			<?php if ( $is_recurring ) : ?>
				<?php if ( ! empty( $donation['started'] ) ) : ?>
					<tr>
						<td><?php esc_html_e( 'First donation', 'newspack-plugin' ); ?></td>
						<td><?php echo esc_html( $format_date( $donation['started'] ) ); ?></td>
					</tr>
				<?php endif; ?>
				<?php if ( ! empty( $donation['latest_payment'] ) ) : ?>
					<tr>
						<td><?php esc_html_e( 'Latest donation', 'newspack-plugin' ); ?></td>
						<td><?php echo esc_html( $format_date( $donation['latest_payment'] ) ); ?></td>
					</tr>
				<?php endif; ?>
				<tr>
					<td><?php esc_html_e( 'Next donation', 'newspack-plugin' ); ?></td>
					<td>
						<?php
						echo esc_html(
							! empty( $donation['next_payment'] )
								? $format_date( $donation['next_payment'] )
								: '—'
						);
						?>
					</td>
				</tr>
			<?php elseif ( ! empty( $donation['date'] ) ) : ?>
				<tr>
					<td><?php esc_html_e( 'Donation date', 'newspack-plugin' ); ?></td>
					<td><?php echo esc_html( $format_date( $donation['date'] ) ); ?></td>
				</tr>
			<?php endif; ?>
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
							<?php
							/* translators: %s: card expiry, e.g. 02/27. */
							echo esc_html( sprintf( __( 'Exp. %s', 'newspack-plugin' ), $payment['exp'] ) );
							?>
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
						<th class="order-total woocommerce-orders-table__header woocommerce-orders-table__header-order-total"><span class="nobr"><?php esc_html_e( 'Amount', 'newspack-plugin' ); ?></span></th>
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
							<td class="order-total woocommerce-orders-table__cell woocommerce-orders-table__cell-order-total" data-title="<?php esc_attr_e( 'Amount', 'newspack-plugin' ); ?>">
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
/*
 * Phase 5 modal partials — rendered outside the detail-page wrap so the
 * dispatcher's click listener (registered on the wrap) doesn't see modal-
 * internal clicks. Modify + Cancel render for the active recurring
 * variant; Restart for the cancelled recurring variant. Donation reuses
 * the shared `tiers.billing` fixture for the Restart transaction step's
 * billing readout, since donations don't carry their own billing fixture
 * in the fake data and the demo address is the same one the Renew /
 * Change subscription modals already render.
 */
$reader             = isset( $data['reader'] ) ? $data['reader'] : [];
$reader_email       = isset( $reader['email'] ) ? (string) $reader['email'] : '';
$subscriptions_data = isset( $data['subscriptions'] ) ? $data['subscriptions'] : [];
$shared_billing     = isset( $subscriptions_data['tiers']['billing'] ) ? $subscriptions_data['tiers']['billing'] : [];

if ( $is_recurring && $is_active ) {
	load_template(
		__DIR__ . '/partials/modify-donation-modal.php',
		false,
		[
			'donation'        => $donation,
			'currency_symbol' => $currency_symbol,
		]
	);
	load_template(
		__DIR__ . '/partials/cancel-donation-modal.php',
		false,
		[
			'donation'     => $donation,
			'reader_email' => $reader_email,
		]
	);
}
if ( $is_recurring && $is_cancelled ) {
	load_template(
		__DIR__ . '/partials/restart-donation-modal.php',
		false,
		[
			'donation'        => $donation,
			'billing'         => $shared_billing,
			'currency_symbol' => $currency_symbol,
		]
	);
}
?>
