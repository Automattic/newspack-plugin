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
 * Pure newspack-ui composition — see brief §6.
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
$donation         = isset( $args['donation'] ) ? $args['donation'] : [];
$kind             = isset( $donation['kind'] ) ? (string) $donation['kind'] : 'recurring';
$donation_status  = isset( $donation['status'] ) ? (string) $donation['status'] : '';
$is_recurring     = 'recurring' === $kind;
$is_active        = 'active' === $donation_status;
$is_cancelled     = 'cancelled' === $donation_status;
$fees_covered     = ! empty( $donation['fees_covered'] );

$donation_id   = isset( $donation['id'] ) ? (string) $donation['id'] : '';
$amount        = isset( $donation['amount'] ) ? (float) $donation['amount'] : 0.0;
$frequency     = isset( $donation['frequency'] ) ? (string) $donation['frequency'] : '';
$subtotal      = isset( $donation['subtotal'] ) ? (float) $donation['subtotal'] : 0.0;
$vat           = isset( $donation['vat'] ) ? (float) $donation['vat'] : 0.0;
$transaction   = isset( $donation['transaction_fee'] ) ? $donation['transaction_fee'] : null;
$total         = isset( $donation['total'] ) ? (float) $donation['total'] : $amount;
$payment       = isset( $donation['payment_method'] ) ? $donation['payment_method'] : [];
$history       = isset( $donation['billing_history'] ) ? $donation['billing_history'] : [];

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
$status_dot = static function ( $s ) {
	$class = 'newspack-ui__color--neutral-50';
	if ( 'paid' === $s ) {
		$class = 'newspack-ui__color--success-50';
	} elseif ( 'cancelled' === $s || 'expired' === $s ) {
		$class = 'newspack-ui__color--error-50';
	}
	return '<span aria-hidden="true" class="' . esc_attr( $class ) . '">●</span>';
};
$status_label = static function ( $s ) {
	switch ( $s ) {
		case 'paid':
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
?>
<div
	class="newspack-my-account-v2-demo-donation-details newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-6"
	data-newspack-my-account-v2-demo="donation-details"
	data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
	data-donation-kind="<?php echo esc_attr( $kind ); ?>"
	data-donation-status="<?php echo esc_attr( $donation_status ); ?>"
>
	<header class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-3 newspack-ui__stack--align-center newspack-ui__stack--justify-between">
		<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-2 newspack-ui__stack--align-center">
			<a
				href="<?php echo esc_url( $list_url ); ?>"
				class="newspack-ui__button newspack-ui__button--ghost"
				aria-label="<?php esc_attr_e( 'Back to donations', 'newspack-plugin' ); ?>"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
					<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</a>
			<h1 class="newspack-ui__font--xl newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php echo esc_html( $header_title ); ?>
			</h1>
			<?php if ( $is_recurring && $is_cancelled ) : ?>
				<span class="newspack-ui__badge newspack-ui__badge--error">
					<?php esc_html_e( 'Cancelled', 'newspack-plugin' ); ?>
				</span>
			<?php endif; ?>
		</div>
		<?php if ( $is_recurring && $is_active ) : ?>
			<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-2 newspack-ui__stack--align-center">
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--secondary"
					data-action="modify-donation"
					data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
				>
					<?php esc_html_e( 'Edit donation', 'newspack-plugin' ); ?>
				</button>
				<div class="newspack-ui__dropdown">
					<button
						type="button"
						class="newspack-ui__button newspack-ui__button--secondary newspack-ui__dropdown__toggle"
						aria-haspopup="menu"
						aria-expanded="false"
					>
						<?php esc_html_e( 'More', 'newspack-plugin' ); ?>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
							<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					<div class="newspack-ui__dropdown__content" role="menu">
						<ul>
							<li>
								<button
									type="button"
									class="newspack-ui__button"
									data-action="update-payment-method"
									data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
									role="menuitem"
								>
									<?php esc_html_e( 'Update payment method', 'newspack-plugin' ); ?>
								</button>
							</li>
							<li>
								<button
									type="button"
									class="newspack-ui__button newspack-ui__button--destructive"
									data-action="cancel-donation"
									data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
									role="menuitem"
								>
									<?php esc_html_e( 'Cancel donation', 'newspack-plugin' ); ?>
								</button>
							</li>
						</ul>
					</div>
				</div>
			</div>
		<?php elseif ( $is_recurring && $is_cancelled ) : ?>
			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--secondary"
				data-action="restart-donation"
				data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
			>
				<?php esc_html_e( 'Restart donation', 'newspack-plugin' ); ?>
			</button>
		<?php endif; ?>
	</header>

	<?php if ( ! $fees_covered ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-2" data-section-id="amount">
			<h2 class="newspack-ui__font--s newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php esc_html_e( 'Amount', 'newspack-plugin' ); ?>
			</h2>
			<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--justify-between newspack-ui__stack--align-baseline">
				<span class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Donation', 'newspack-plugin' ); ?></span>
				<span><?php echo esc_html( $format_amount( $subtotal ) ); ?></span>
			</div>
			<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--justify-between newspack-ui__stack--align-baseline">
				<span class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Subtotal', 'newspack-plugin' ); ?></span>
				<span><?php echo esc_html( $format_amount( $subtotal ) ); ?></span>
			</div>
			<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--justify-between newspack-ui__stack--align-baseline">
				<span class="newspack-ui__color--neutral-60"><?php esc_html_e( 'VAT', 'newspack-plugin' ); ?></span>
				<span><?php echo esc_html( $format_amount( $vat ) ); ?></span>
			</div>
			<?php if ( null !== $transaction ) : ?>
				<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--justify-between newspack-ui__stack--align-baseline">
					<span class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Transaction fee', 'newspack-plugin' ); ?></span>
					<span><?php echo esc_html( $format_amount( $transaction ) ); ?></span>
				</div>
			<?php endif; ?>
			<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--justify-between newspack-ui__stack--align-baseline">
				<span class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Total', 'newspack-plugin' ); ?></span>
				<span class="newspack-ui__font--bold">
					<?php
					if ( $is_recurring && $frequency ) {
						/* translators: %1$s: amount with currency, %2$s: frequency unit. */
						echo esc_html( sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $format_amount( $total ), $frequency ) );
					} else {
						echo esc_html( $format_amount( $total ) );
					}
					?>
				</span>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/*
	 * Date rows. Recurring donations show First / Latest / Next; one-times
	 * collapse to a single "Donation date" row. Each row is a 2-column flex
	 * row with the heading on the left and the value on the right.
	 */
	$date_rows = [];
	if ( $is_recurring ) {
		if ( ! empty( $donation['started'] ) ) {
			$date_rows[] = [
				'label' => __( 'First donation', 'newspack-plugin' ),
				'value' => $format_date( $donation['started'] ),
			];
		}
		if ( ! empty( $donation['latest_payment'] ) ) {
			$date_rows[] = [
				'label' => __( 'Latest donation', 'newspack-plugin' ),
				'value' => $format_date( $donation['latest_payment'] ),
			];
		}
		$next_value = ! empty( $donation['next_payment'] )
			? $format_date( $donation['next_payment'] )
			: '—';
		$date_rows[] = [
			'label' => __( 'Next donation', 'newspack-plugin' ),
			'value' => $next_value,
		];
	} elseif ( ! empty( $donation['date'] ) ) {
		$date_rows[] = [
			'label' => __( 'Donation date', 'newspack-plugin' ),
			'value' => $format_date( $donation['date'] ),
		];
	}
	?>
	<?php foreach ( $date_rows as $row ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--justify-between newspack-ui__stack--gap-3 newspack-ui__stack--align-start">
			<h2 class="newspack-ui__font--s newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php echo esc_html( $row['label'] ); ?>
			</h2>
			<div><?php echo esc_html( $row['value'] ); ?></div>
		</section>
	<?php endforeach; ?>

	<?php if ( ! empty( $payment ) ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--justify-between newspack-ui__stack--gap-3 newspack-ui__stack--align-start" data-section-id="payment-method">
			<h2 class="newspack-ui__font--s newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php esc_html_e( 'Payment method', 'newspack-plugin' ); ?>
			</h2>
			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-0">
				<div class="newspack-ui__font--bold">
					<?php
					/* translators: %1$s: card brand, %2$s: last four digits of card number. */
					echo esc_html( sprintf( __( '%1$s ending in %2$s', 'newspack-plugin' ), isset( $payment['brand'] ) ? $payment['brand'] : '', isset( $payment['last4'] ) ? $payment['last4'] : '' ) );
					?>
				</div>
				<?php if ( ! empty( $payment['exp'] ) ) : ?>
					<div class="newspack-ui__color--neutral-60">
						<?php
						/* translators: %s: card expiry, e.g. 02/27. */
						echo esc_html( sprintf( __( 'Exp. %s', 'newspack-plugin' ), $payment['exp'] ) );
						?>
					</div>
				<?php endif; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $history ) ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3" data-section-id="billing-history">
			<h2 class="newspack-ui__font--s newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php esc_html_e( 'Billing history', 'newspack-plugin' ); ?>
			</h2>
			<table class="newspack-my-account-v2-demo-donation-details__billing-table">
				<thead>
					<tr>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Order', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Date', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Status', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Amount', 'newspack-plugin' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $history as $h ) : ?>
						<tr>
							<td><?php echo esc_html( isset( $h['order'] ) ? $h['order'] : '' ); ?></td>
							<td><?php echo esc_html( $format_date( isset( $h['date'] ) ? $h['date'] : '' ) ); ?></td>
							<td>
								<?php
								echo $status_dot( isset( $h['status'] ) ? $h['status'] : '' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
								?>
								<?php echo esc_html( ' ' . $status_label( isset( $h['status'] ) ? $h['status'] : '' ) ); ?>
							</td>
							<td>
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
