<?php
/**
 * My Account v2 prototype — Subscriptions list endpoint.
 *
 * Renders:
 *  - "Active subscription(s)" section: a Plan Card per row in the `active`
 *    bucket. Active rows whose `status` is `expiring` carry an inline error
 *    notice + red "Expires on ..." subtext (Figma 2636:46133); plain `active`
 *    rows show "Renews on ..." subtext (Figma 2636:46117).
 *  - "Previous subscription(s)" section: a clickable Plan Card per row in
 *    the `previous` bucket — the whole card is an anchor to the detail page.
 *    Right-side meta text is derived from status (Cancelled / Expired).
 *
 * Detail-page-only fixtures (renewed / no-fees / expiring detail) live in the
 * `extras` bucket and are reachable by direct URL only — they don't render
 * here. See get_fake_subscriptions().
 *
 * Pure newspack-ui composition — see brief §6.
 *
 * @package Newspack
 * @var array $args Template args; expected to contain `data` => fake-data array.
 */

defined( 'ABSPATH' ) || exit;

$data            = isset( $args['data'] ) ? $args['data'] : [];
$subscriptions   = isset( $data['subscriptions'] ) ? $data['subscriptions'] : [];
$currency_symbol = isset( $subscriptions['currency_symbol'] ) ? (string) $subscriptions['currency_symbol'] : '$';
$active          = isset( $subscriptions['active'] ) ? $subscriptions['active'] : [];
$previous        = isset( $subscriptions['previous'] ) ? $subscriptions['previous'] : [];

/**
 * Pretty-print a YYYY-MM-DD date using WP's date_i18n.
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
 * Frequency unit string used in the "AMOUNT / unit" header label. Defaults
 * to the row's `frequency` (year/month/week) — keeps the schema simple
 * since brief §7 is the source of truth.
 *
 * @param array $row Subscription row.
 * @return string
 */
$frequency_unit = static function ( $row ) {
	return isset( $row['frequency'] ) ? (string) $row['frequency'] : 'year';
};

/**
 * Right-side meta string for a Previous-section card. Status drives the
 * default; an explicit `list_meta` override on the row wins.
 *
 * @param array    $row         Subscription row.
 * @param callable $format_date Date formatter.
 * @return string
 */
$previous_meta = static function ( $row ) use ( $format_date ) {
	$status = isset( $row['status'] ) ? (string) $row['status'] : '';
	switch ( $status ) {
		case 'cancelled':
			$date = ! empty( $row['cancelled'] ) ? $format_date( $row['cancelled'] ) : '';
			return $date
				/* translators: %s: cancellation date. */
				? sprintf( __( 'Cancelled on %s', 'newspack-plugin' ), $date )
				: __( 'Cancelled', 'newspack-plugin' );
		case 'expired':
			$date = ! empty( $row['expires_on'] ) ? $format_date( $row['expires_on'] ) : '';
			return $date
				/* translators: %s: expiry date. */
				? sprintf( __( 'Expired on %s', 'newspack-plugin' ), $date )
				: __( 'Expired', 'newspack-plugin' );
		default:
			return '';
	}
};

/**
 * Right-side meta colour for a Previous-section card. Errors render in red,
 * everything else in neutral grey. Returns the bare newspack-ui colour class.
 *
 * @param array $row Subscription row.
 * @return string
 */
$previous_meta_color = static function ( $row ) {
	$status = isset( $row['status'] ) ? (string) $row['status'] : '';
	if ( 'cancelled' === $status || 'expired' === $status ) {
		return 'newspack-ui__color--error-50';
	}
	return 'newspack-ui__color--neutral-60';
};
?>
<div
	class="newspack-my-account__v2-demo-subscriptions newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-9"
	data-newspack-my-account-v2-demo="subscriptions"
>
	<?php if ( ! empty( $active ) ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-5" data-section-id="active">
			<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php
				echo esc_html(
					_n(
						'Active subscription',
						'Active subscriptions',
						count( $active ),
						'newspack-plugin'
					)
				);
				?>
			</h2>
			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3">
				<?php foreach ( $active as $sub ) : ?>
					<?php
					$subscription_id     = isset( $sub['id'] ) ? (string) $sub['id'] : '';
					$subscription_status = isset( $sub['status'] ) ? (string) $sub['status'] : 'active';
					$is_expiring         = 'expiring' === $subscription_status;
					$product             = isset( $sub['product'] ) ? (string) $sub['product'] : '';
					$amount_label        = $format_amount( isset( $sub['amount'] ) ? $sub['amount'] : 0 );
					/* translators: %1$s: amount with currency, %2$s: frequency unit (year, month). */
					$amount_per          = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $amount_label, $frequency_unit( $sub ) );
					$detail_url          = \Newspack\My_Account_UI_V2_Demo::subscriptions_url( $subscription_id );

					if ( $is_expiring ) {
						$expires_on = ! empty( $sub['expires_on'] ) ? $format_date( $sub['expires_on'] ) : '';
						/* translators: %s: subscription expiry date. */
						$subtext     = $expires_on ? sprintf( __( 'Expires on %s', 'newspack-plugin' ), $expires_on ) : __( 'Expiring', 'newspack-plugin' );
						$subtext_cls = 'newspack-ui__color--error-50';
					} else {
						$next_payment = ! empty( $sub['next_payment'] ) ? $format_date( $sub['next_payment'] ) : '';
						/* translators: %s: subscription renewal date. */
						$subtext      = $next_payment ? sprintf( __( 'Renews on %s', 'newspack-plugin' ), $next_payment ) : '';
						$subtext_cls  = 'newspack-ui__color--neutral-60';
					}
					?>
					<div
						class="newspack-ui__box newspack-ui__box--border newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-4"
						data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
						data-subscription-status="<?php echo esc_attr( $subscription_status ); ?>"
					>
						<?php if ( $is_expiring ) : ?>
							<?php
							$expiry_date = ! empty( $sub['expires_on'] ) ? $format_date( $sub['expires_on'] ) : '';
							?>
							<div class="newspack-ui__notice newspack-ui__notice--error">
								<?php
								if ( $expiry_date ) {
									echo wp_kses(
										sprintf(
											/* translators: 1: subscription expiry date in <strong>; 2: opening "renew now" anchor; 3: closing anchor. */
											__( 'Your subscription has been cancelled. Subscription remains active until %1$s. For uninterrupted service, %2$srenew now%3$s.', 'newspack-plugin' ),
											'<strong>' . esc_html( $expiry_date ) . '</strong>',
											'<a href="' . esc_url( $detail_url ) . '#renew" data-action="renew-subscription" data-subscription-id="' . esc_attr( $subscription_id ) . '">',
											'</a>'
										),
										[
											'strong' => [],
											'a'      => [
												'href' => true,
												'data-action' => true,
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
						<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-5 newspack-ui__stack--align-center newspack-ui__stack--justify-between">
							<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-1">
								<div class="newspack-ui__font--m newspack-ui__font--bold">
									<?php if ( $product ) : ?>
										<span><?php echo esc_html( $product ); ?></span>
										<span aria-hidden="true" class="newspack-ui__color--neutral-30"> | </span>
									<?php endif; ?>
									<span><?php echo esc_html( $amount_per ); ?></span>
								</div>
								<?php if ( $subtext ) : ?>
									<span class="newspack-ui__font--xs <?php echo esc_attr( $subtext_cls ); ?>">
										<?php echo esc_html( $subtext ); ?>
									</span>
								<?php endif; ?>
							</div>
							<a
								href="<?php echo esc_url( $detail_url ); ?>"
								class="newspack-ui__button newspack-ui__button--secondary"
								data-action="manage-subscription"
								data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
							>
								<?php esc_html_e( 'Manage subscription', 'newspack-plugin' ); ?>
							</a>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $previous ) ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-5" data-section-id="previous">
			<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php
				echo esc_html(
					_n(
						'Previous subscription',
						'Previous subscriptions',
						count( $previous ),
						'newspack-plugin'
					)
				);
				?>
			</h2>
			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3">
				<?php foreach ( $previous as $sub ) : ?>
					<?php
					$subscription_id     = isset( $sub['id'] ) ? (string) $sub['id'] : '';
					$subscription_status = isset( $sub['status'] ) ? (string) $sub['status'] : '';
					$product             = isset( $sub['product'] ) ? (string) $sub['product'] : '';
					$amount_label        = $format_amount( isset( $sub['amount'] ) ? $sub['amount'] : 0 );
					/* translators: %1$s: amount with currency, %2$s: frequency unit. */
					$amount_per          = sprintf( __( '%1$s / %2$s', 'newspack-plugin' ), $amount_label, $frequency_unit( $sub ) );
					$detail_url          = \Newspack\My_Account_UI_V2_Demo::subscriptions_url( $subscription_id );
					$meta_text           = $previous_meta( $sub );
					$meta_color          = $previous_meta_color( $sub );
					$row_label           = $product
						? sprintf(
							/* translators: %1$s: subscription product name, %2$s: amount + frequency. */
							__( 'View %1$s subscription, %2$s', 'newspack-plugin' ),
							$product,
							$amount_per
						)
						: sprintf(
							/* translators: %s: amount + frequency. */
							__( 'View subscription, %s', 'newspack-plugin' ),
							$amount_per
						);
					?>
					<a
						href="<?php echo esc_url( $detail_url ); ?>"
						class="newspack-ui__box newspack-ui__box--border newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-5 newspack-ui__stack--align-center newspack-ui__stack--justify-between"
						data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
						data-subscription-status="<?php echo esc_attr( $subscription_status ); ?>"
						aria-label="<?php echo esc_attr( $row_label ); ?>"
					>
						<div class="newspack-ui__font--m newspack-ui__font--bold">
							<?php if ( $product ) : ?>
								<span><?php echo esc_html( $product ); ?></span>
								<span aria-hidden="true" class="newspack-ui__color--neutral-30"> | </span>
							<?php endif; ?>
							<span><?php echo esc_html( $amount_per ); ?></span>
						</div>
						<?php if ( $meta_text ) : ?>
							<span class="newspack-ui__font--xs <?php echo esc_attr( $meta_color ); ?>">
								<?php echo esc_html( $meta_text ); ?>
							</span>
						<?php endif; ?>
					</a>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>
</div>
