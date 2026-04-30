<?php
/**
 * My Account v2 prototype — Donations list endpoint.
 *
 * Renders:
 *  - "Recurring donation" section: a Plan Card (one __box) per active
 *    recurring donation, with the amount / next-payment date on the left and
 *    a "Manage donation" link to the detail page on the right.
 *  - "Previous donations" table: cancelled recurring + one-time donations,
 *    columns Date | Frequency | Status | Amount. Rows carry a `data-href`
 *    so JS navigates to the detail page on click.
 *  - Bottom: a "Billing history" Button Card (Figma 2636:46467) by default,
 *    or an inline billing-history table when `billing_history_inline` is
 *    true (Figma 3619:292407 — Phase 6 wires the scenario flag).
 *
 * Pure newspack-ui composition — see brief §6.
 *
 * @package Newspack
 * @var array $args Template args; expected to contain `data` => fake-data array.
 */

defined( 'ABSPATH' ) || exit;

$data            = isset( $args['data'] ) ? $args['data'] : [];
$donations       = isset( $data['donations'] ) ? $data['donations'] : [];
$currency_symbol = isset( $donations['currency_symbol'] ) ? (string) $donations['currency_symbol'] : '$';
$recurring_all   = isset( $donations['recurring'] ) ? $donations['recurring'] : [];
$one_time        = isset( $donations['one_time'] ) ? $donations['one_time'] : [];
$active_recurring = array_values(
	array_filter(
		$recurring_all,
		static function ( $row ) {
			return isset( $row['status'] ) && 'active' === $row['status'];
		}
	)
);
$previous_recurring = array_values(
	array_filter(
		$recurring_all,
		static function ( $row ) {
			return isset( $row['status'] ) && 'active' !== $row['status'];
		}
	)
);

// Compose a flat "Previous donations" list from cancelled/expired recurring +
// all one-times, sorted newest-first by their reference date.
$previous = [];
foreach ( $previous_recurring as $row ) {
	$previous[] = [
		'id'        => isset( $row['id'] ) ? (string) $row['id'] : '',
		'date'      => isset( $row['cancelled'] ) && $row['cancelled']
			? (string) $row['cancelled']
			: ( isset( $row['latest_payment'] ) ? (string) $row['latest_payment'] : '' ),
		'frequency' => isset( $row['frequency_label'] ) ? (string) $row['frequency_label'] : '',
		'status'    => isset( $row['status'] ) ? (string) $row['status'] : '',
		'amount'    => isset( $row['amount'] ) ? (float) $row['amount'] : 0.0,
	];
}
foreach ( $one_time as $row ) {
	$previous[] = [
		'id'        => isset( $row['id'] ) ? (string) $row['id'] : '',
		'date'      => isset( $row['date'] ) ? (string) $row['date'] : '',
		'frequency' => __( 'One-time', 'newspack-plugin' ),
		'status'    => isset( $row['status'] ) ? (string) $row['status'] : 'paid',
		'amount'    => isset( $row['amount'] ) ? (float) $row['amount'] : 0.0,
	];
}
// Newest first.
usort(
	$previous,
	static function ( $a, $b ) {
		return strcmp( (string) $b['date'], (string) $a['date'] );
	}
);

$billing_history_inline = ! empty( $donations['billing_history_inline'] );
$billing_history_button = isset( $donations['billing_history_button'] ) ? $donations['billing_history_button'] : [];

/**
 * Inline status-dot helper. Uses U+25CF "BLACK CIRCLE" coloured by the
 * newspack-ui color utility — keeps the dot purely a composition (no SCSS).
 *
 * @param string $status Status slug (paid / cancelled / etc.).
 * @return string HTML snippet.
 */
$status_dot = static function ( $status ) {
	$class = 'newspack-ui__color--neutral-50';
	if ( 'paid' === $status ) {
		$class = 'newspack-ui__color--success-50';
	} elseif ( 'cancelled' === $status || 'expired' === $status ) {
		$class = 'newspack-ui__color--error-50';
	}
	return '<span aria-hidden="true" class="' . esc_attr( $class ) . '">●</span>';
};

/**
 * Pretty-print a date stored as YYYY-MM-DD using WP's date_i18n.
 *
 * @param string $iso ISO date.
 * @return string
 */
$format_date = static function ( $iso ) {
	if ( empty( $iso ) ) {
		return '';
	}
	$ts = strtotime( $iso );
	if ( ! $ts ) {
		return (string) $iso;
	}
	return date_i18n( 'M j, Y', $ts );
};

/**
 * Format an amount with the page-level currency symbol. Two decimals.
 *
 * @param float $amount Amount.
 * @return string
 */
$format_amount = static function ( $amount ) use ( $currency_symbol ) {
	return $currency_symbol . number_format_i18n( (float) $amount, 2 );
};

/**
 * Translate a status slug to its display label.
 *
 * @param string $status Status slug.
 * @return string
 */
$status_label = static function ( $status ) {
	switch ( $status ) {
		case 'paid':
			return __( 'Paid', 'newspack-plugin' );
		case 'cancelled':
			return __( 'Cancelled', 'newspack-plugin' );
		case 'expired':
			return __( 'Expired', 'newspack-plugin' );
		case 'refunded':
			return __( 'Refunded', 'newspack-plugin' );
		default:
			return ucfirst( (string) $status );
	}
};
?>
<div
	class="newspack-my-account-v2-demo-donations newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--justify-between"
	data-newspack-my-account-v2-demo="donations"
>
	<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-9">
		<?php if ( empty( $active_recurring ) && empty( $previous ) ) : ?>
			<div class="newspack-ui__notice">
				<?php esc_html_e( 'You have no donations yet.', 'newspack-plugin' ); ?>
			</div>
		<?php endif; ?>

		<?php if ( ! empty( $active_recurring ) ) : ?>
			<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-5" data-section-id="recurring">
			<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php
				echo esc_html(
					_n(
						'Recurring donation',
						'Recurring donations',
						count( $active_recurring ),
						'newspack-plugin'
					)
				);
				?>
			</h2>
			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3">
				<?php foreach ( $active_recurring as $don ) : ?>
					<?php
					$donation_id     = isset( $don['id'] ) ? (string) $don['id'] : '';
					$amount_label    = $format_amount( isset( $don['amount'] ) ? $don['amount'] : 0 );
					$frequency_unit  = isset( $don['frequency'] ) ? (string) $don['frequency'] : 'month';
					/* translators: %1$s: amount with currency, %2$s: frequency unit (month, year). */
					$amount_per      = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $amount_label, $frequency_unit );
					$next_payment    = isset( $don['next_payment'] ) ? $format_date( $don['next_payment'] ) : '';
					$detail_url      = \Newspack\My_Account_V2_Demo::donations_url( $donation_id );
					?>
					<div class="newspack-ui__box newspack-ui__box--border newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-5 newspack-ui__stack--align-center newspack-ui__stack--justify-between">
						<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-1">
							<span class="newspack-ui__font--m newspack-ui__font--bold"><?php echo esc_html( $amount_per ); ?></span>
							<?php if ( $next_payment ) : ?>
								<span class="newspack-ui__font--xs newspack-ui__color--neutral-60">
									<?php
									/* translators: %s: formatted date. */
									echo esc_html( sprintf( __( 'Renews on %s', 'newspack-plugin' ), $next_payment ) );
									?>
								</span>
							<?php endif; ?>
						</div>
						<a
							href="<?php echo esc_url( $detail_url ); ?>"
							class="newspack-ui__button newspack-ui__button--secondary"
							data-action="manage-donation"
							data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
						>
							<?php esc_html_e( 'Manage donation', 'newspack-plugin' ); ?>
						</a>
					</div>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $previous ) ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3" data-section-id="previous">
			<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php esc_html_e( 'Previous donations', 'newspack-plugin' ); ?>
			</h2>
			<table class="newspack-my-account-v2-demo-donations__previous-table">
				<thead>
					<tr>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Date', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Frequency', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Status', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Amount', 'newspack-plugin' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $previous as $row ) : ?>
						<?php
						$row_url   = \Newspack\My_Account_V2_Demo::donations_url( $row['id'] );
						$row_label = sprintf(
							/* translators: %1$s: donation date, %2$s: amount with currency. */
							__( 'View donation from %1$s, %2$s', 'newspack-plugin' ),
							$format_date( $row['date'] ),
							$format_amount( $row['amount'] )
						);
						?>
						<tr
							data-href="<?php echo esc_url( $row_url ); ?>"
							data-donation-id="<?php echo esc_attr( $row['id'] ); ?>"
							tabindex="0"
							role="link"
							aria-label="<?php echo esc_attr( $row_label ); ?>"
						>
							<td><?php echo esc_html( $format_date( $row['date'] ) ); ?></td>
							<td><?php echo esc_html( $row['frequency'] ); ?></td>
							<td>
								<?php
								// status_dot returns a tiny pre-built span; safe to echo unescaped.
								echo $status_dot( $row['status'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
								?>
								<?php echo esc_html( ' ' . $status_label( $row['status'] ) ); ?>
							</td>
							<td><?php echo esc_html( $format_amount( $row['amount'] ) ); ?></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</section>
		<?php endif; ?>
	</div>

	<?php if ( $billing_history_inline ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3" data-section-id="billing-history">
			<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php esc_html_e( 'Billing history', 'newspack-plugin' ); ?>
			</h2>
			<?php
			// Aggregate every billing-history row across every donation so the
			// embedded variant (Figma 3619:292407) shows a flat reverse-chrono
			// list. Phase 6 may revisit (per-donation grouping, paging, etc.).
			$all_rows = [];
			foreach ( array_merge( $recurring_all, $one_time ) as $don ) {
				$rows = isset( $don['billing_history'] ) ? $don['billing_history'] : [];
				foreach ( $rows as $r ) {
					$all_rows[] = $r;
				}
			}
			usort(
				$all_rows,
				static function ( $a, $b ) {
					return strcmp( (string) ( isset( $b['date'] ) ? $b['date'] : '' ), (string) ( isset( $a['date'] ) ? $a['date'] : '' ) );
				}
			);
			?>
			<table class="newspack-my-account-v2-demo-donations__billing-table">
				<thead>
					<tr>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Order', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Date', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Status', 'newspack-plugin' ); ?></th>
						<th scope="col" class="newspack-ui__color--neutral-60"><?php esc_html_e( 'Amount', 'newspack-plugin' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $all_rows as $r ) : ?>
						<tr>
							<td><?php echo esc_html( isset( $r['order'] ) ? $r['order'] : '' ); ?></td>
							<td><?php echo esc_html( $format_date( isset( $r['date'] ) ? $r['date'] : '' ) ); ?></td>
							<td>
								<?php
								echo $status_dot( isset( $r['status'] ) ? $r['status'] : '' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
								?>
								<?php echo esc_html( ' ' . $status_label( isset( $r['status'] ) ? $r['status'] : '' ) ); ?>
							</td>
							<td>
								<?php
								echo esc_html(
									null === ( isset( $r['amount'] ) ? $r['amount'] : null )
										? '—'
										: $format_amount( $r['amount'] )
								);
								?>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</section>
	<?php elseif ( ! empty( $billing_history_button['enabled'] ) ) : ?>
		<a
			href="#"
			class="newspack-ui__box newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-5 newspack-ui__stack--align-center newspack-ui__stack--justify-between"
			data-action="open-billing-history"
		>
			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-1">
				<span class="newspack-ui__font--m newspack-ui__font--bold">
					<?php echo esc_html( isset( $billing_history_button['title'] ) ? $billing_history_button['title'] : __( 'Billing history', 'newspack-plugin' ) ); ?>
				</span>
				<span class="newspack-ui__font--xs newspack-ui__color--neutral-60">
					<?php echo esc_html( isset( $billing_history_button['description'] ) ? $billing_history_button['description'] : '' ); ?>
				</span>
			</div>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
				<path d="M19 3H5C3.9 3 3 3.9 3 5v16l3-2 3 2 3-2 3 2 3-2 3 2V5c0-1.1-.9-2-2-2zm-1 14.5L17 17l-3 2-3-2-3 2-3-2-1 .5V5h14v12.5zM6 7h12v2H6V7zm0 4h12v2H6v-2zm0 4h7v2H6v-2z" fill="currentColor"/>
			</svg>
		</a>
	<?php endif; ?>
</div>
