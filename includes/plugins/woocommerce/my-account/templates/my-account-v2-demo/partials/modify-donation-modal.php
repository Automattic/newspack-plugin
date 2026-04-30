<?php
/**
 * My Account v2 prototype — Modify donation modal partial.
 *
 * Single-step editor (Figma 2636:46578). Contents:
 *  - Frequency segmented control (Monthly / Annually) — preselects the
 *    donation's current frequency.
 *  - Amount currency input prefilled with the donation's current amount.
 *    `Amount / month|year` heading reflects the active tab.
 *  - "Cover transaction fees?" checkbox — toggles whether the breakdown
 *    includes the 2% transaction fee row.
 *  - Recurring totals box: subtotal, VAT, transaction fee, recurring total
 *    (with next-donation date below the total). Recomputed in JS as the
 *    amount or fee toggle changes — markup carries the initial values + a
 *    suite of `data-modify-*` hooks the JS targets.
 *  - Confirm button labelled "Confirm donation: $X / unit", recomputed too.
 *
 * Math is approximate (subtotal = amount / 1.2; vat = amount - subtotal;
 * fee = amount * 0.02 if covered) — Phase 6 polish or productisation can
 * swap in real WC logic.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `donation`        => the donation row (active recurring).
 *                  - `currency_symbol` => currency symbol from fake data.
 */

defined( 'ABSPATH' ) || exit;

$donation        = isset( $args['donation'] ) ? $args['donation'] : [];
$currency_symbol = isset( $args['currency_symbol'] ) ? (string) $args['currency_symbol'] : '$';
$donation_id     = isset( $donation['id'] ) ? (string) $donation['id'] : '';

$initial_amount    = isset( $donation['amount'] ) ? (float) $donation['amount'] : 0.0;
$initial_frequency = isset( $donation['frequency'] ) ? (string) $donation['frequency'] : 'month';
$fees_covered      = ! empty( $donation['fees_covered'] );
$next_payment_iso  = isset( $donation['next_payment'] ) ? (string) $donation['next_payment'] : '';
$next_payment_date = '';
if ( '' !== $next_payment_iso ) {
	$ts                = strtotime( $next_payment_iso );
	$next_payment_date = $ts ? date_i18n( 'F j, Y', $ts ) : $next_payment_iso;
}

// Frequency catalogue (label = tab text, unit = "/ unit" suffix).
$frequencies = [
	[
		'id'    => 'month',
		'label' => __( 'Monthly', 'newspack-plugin' ),
		'unit'  => __( 'month', 'newspack-plugin' ),
	],
	[
		'id'    => 'year',
		'label' => __( 'Annually', 'newspack-plugin' ),
		'unit'  => __( 'year', 'newspack-plugin' ),
	],
];

$unit_labels = [];
foreach ( $frequencies as $freq ) {
	$unit_labels[ $freq['id'] ] = $freq['unit'];
}
$initial_unit = isset( $unit_labels[ $initial_frequency ] ) ? $unit_labels[ $initial_frequency ] : $initial_frequency;

// Initial breakdown values, mirroring the live JS recompute. Vat rate matches
// the fake-data fixture (subtotal/total ratio); kept here as a single source
// for the data attributes the JS reads.
$vat_rate         = 0.20;
$fee_rate         = 0.02;
$initial_subtotal = $initial_amount / ( 1 + $vat_rate );
$initial_vat      = $initial_amount - $initial_subtotal;
$initial_fee      = $fees_covered ? $initial_amount * $fee_rate : null;
$initial_total    = $fees_covered ? $initial_amount + ( null === $initial_fee ? 0 : $initial_fee ) : $initial_amount;

$format_amount = static function ( $value ) use ( $currency_symbol ) {
	return $currency_symbol . number_format_i18n( (float) $value, 2 );
};

// Per-frequency next-donation dates. The donation only carries a single
// `next_payment` for its current frequency; for the alternative tab we
// project a "today + 1 month|year" date so the readout still reads as a
// real value when the reader flips frequencies. JSON-encoded for JS.
$next_dates = [];
if ( '' !== $next_payment_date ) {
	$next_dates[ $initial_frequency ] = $next_payment_date;
}
foreach ( $frequencies as $freq ) {
	if ( isset( $next_dates[ $freq['id'] ] ) ) {
		continue;
	}
	$ts                       = strtotime( '+1 ' . $freq['id'] );
	$next_dates[ $freq['id'] ] = $ts ? date_i18n( 'F j, Y', $ts ) : '';
}

// Confirm button label is always "Confirm donation: $X / unit". Initial render
// matches the donation's current values; JS keeps it in sync afterwards.
/* translators: %1$s: amount with currency, %2$s: frequency unit. */
$initial_confirm_label = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $format_amount( $initial_amount ), $initial_unit );
?>
<div
	id="newspack-my-account__modify-donation-<?php echo esc_attr( $donation_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account-v2-demo-modify-donation"
	data-state="closed"
	data-newspack-my-account-v2-demo="modify-donation-modal"
	data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
	data-currency-symbol="<?php echo esc_attr( $currency_symbol ); ?>"
	data-vat-rate="<?php echo esc_attr( (string) $vat_rate ); ?>"
	data-fee-rate="<?php echo esc_attr( (string) $fee_rate ); ?>"
	data-initial-frequency="<?php echo esc_attr( $initial_frequency ); ?>"
	data-unit-labels="<?php echo esc_attr( wp_json_encode( $unit_labels ) ); ?>"
	data-next-dates="<?php echo esc_attr( wp_json_encode( $next_dates ) ); ?>"
	data-recurring-total-labels="<?php echo esc_attr( wp_json_encode( [ 'heading' => __( 'Recurring totals', 'newspack-plugin' ) ] ) ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Edit donation', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content">
			<div class="newspack-ui__segmented-control">
				<h3><?php esc_html_e( 'Frequency', 'newspack-plugin' ); ?></h3>
				<div class="newspack-ui__segmented-control__tabs" role="tablist" aria-label="<?php esc_attr_e( 'Donation frequency', 'newspack-plugin' ); ?>">
					<?php foreach ( $frequencies as $freq ) : ?>
						<?php
						$is_current = $freq['id'] === $initial_frequency;
						$tab_class  = 'newspack-ui__button newspack-ui__button--small';
						if ( $is_current ) {
							$tab_class .= ' selected';
						}
						?>
						<button
							type="button"
							class="<?php echo esc_attr( $tab_class ); ?>"
							role="tab"
							data-frequency="<?php echo esc_attr( $freq['id'] ); ?>"
							aria-selected="<?php echo $is_current ? 'true' : 'false'; ?>"
						>
							<?php echo esc_html( $freq['label'] ); ?>
						</button>
					<?php endforeach; ?>
				</div>
			</div>

			<div>
				<h3>
					<?php
					// "Amount / <unit>" — the unit span is updated in JS as the
					// active tab changes, so it stays in sync with the segmented
					// control (Figma 2636:46578).
					esc_html_e( 'Amount /', 'newspack-plugin' );
					?>
					<span data-modify-amount-unit><?php echo esc_html( $initial_unit ); ?></span>
				</h3>
				<?php
				// `<input type="number">` requires a dot-decimal value regardless
				// of locale; the JS `parseFloat()` in donations.js can't handle
				// `9,99` from a comma-decimal locale. Use plain `number_format`
				// with explicit `.` decimal sep + no thousands separator for both
				// the input value and the data-initial-amount attribute.
				$amount_machine = number_format( $initial_amount, 2, '.', '' );
				?>
				<div class="newspack-ui__currency-input">
					<span class="newspack-ui__currency-input__currency"><?php echo esc_html( $currency_symbol ); ?></span>
					<input
						type="number"
						min="0"
						step="0.01"
						value="<?php echo esc_attr( $amount_machine ); ?>"
						data-modify-amount
						data-initial-amount="<?php echo esc_attr( $amount_machine ); ?>"
						aria-label="<?php esc_attr_e( 'Amount', 'newspack-plugin' ); ?>"
					>
				</div>
			</div>

			<p class="form-row form-row-wide">
				<label class="checkbox">
					<input
						type="checkbox"
						class="input-checkbox"
						data-modify-cover-fees
						data-initial-checked="<?php echo esc_attr( $fees_covered ? 'true' : 'false' ); ?>"
						<?php checked( $fees_covered ); ?>
					>
					<?php esc_html_e( 'Cover transaction fees?', 'newspack-plugin' ); ?>
				</label>
				<span class="newspack-ui__helper-text">
					<?php
					printf(
						/* translators: %s: site name. */
						esc_html__( 'Cover Stripe’s 2%% transaction fee, so that %s receives 100%% of your payment.', 'newspack-plugin' ),
						esc_html( get_bloginfo( 'name' ) )
					);
					?>
				</span>
			</p>

			<div class="newspack-ui__box">
				<table class="shop_table order_details">
					<thead>
						<tr>
							<th class="product-name" colspan="2" data-modify-totals-heading>
								<?php esc_html_e( 'Recurring totals', 'newspack-plugin' ); ?>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<th scope="row"><?php esc_html_e( 'Subtotal', 'newspack-plugin' ); ?></th>
							<td data-modify-subtotal>
								<?php
								echo esc_html(
									sprintf(
										/* translators: %1$s: amount with currency, %2$s: frequency unit. */
										__( '%1$s / %2$s', 'newspack-plugin' ),
										$format_amount( $initial_subtotal ),
										$initial_unit
									)
								);
								?>
							</td>
						</tr>
						<tr>
							<th scope="row"><?php esc_html_e( 'VAT', 'newspack-plugin' ); ?></th>
							<td data-modify-vat><?php echo esc_html( $format_amount( $initial_vat ) ); ?></td>
						</tr>
						<tr>
							<th scope="row"><?php esc_html_e( 'Transaction fee (2%)', 'newspack-plugin' ); ?></th>
							<td data-modify-fee>
								<?php echo esc_html( null === $initial_fee ? '—' : $format_amount( $initial_fee ) ); ?>
							</td>
						</tr>
						<tr class="order-total">
							<th scope="row"><?php esc_html_e( 'Recurring total', 'newspack-plugin' ); ?></th>
							<td>
								<strong data-modify-total>
									<?php
									echo esc_html(
										sprintf(
											/* translators: %1$s: amount with currency, %2$s: frequency unit. */
											__( '%1$s / %2$s', 'newspack-plugin' ),
											$format_amount( $initial_total ),
											$initial_unit
										)
									);
									?>
								</strong>
								<?php if ( '' !== $next_payment_date ) : ?>
									<div class="newspack-ui__helper-text">
										<?php esc_html_e( 'Next donation:', 'newspack-plugin' ); ?>
										<span data-modify-next><?php echo esc_html( $next_payment_date ); ?></span>
									</div>
								<?php else : ?>
									<div class="newspack-ui__helper-text" hidden>
										<?php esc_html_e( 'Next donation:', 'newspack-plugin' ); ?>
										<span data-modify-next></span>
									</div>
								<?php endif; ?>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="newspack-my-account-v2-demo-modify-donation__actions">
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"
					data-action="confirm"
				>
					<?php esc_html_e( 'Confirm donation:', 'newspack-plugin' ); ?>
					<span data-modify-confirm-label><?php echo esc_html( $initial_confirm_label ); ?></span>
				</button>
				<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
					<?php esc_html_e( 'Cancel', 'newspack-plugin' ); ?>
				</button>
			</div>
		</div>
	</div>
</div>
