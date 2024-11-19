<?php
/**
 * Adds an admin notice when possibly duplicated orders are detected.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Adds an admin notice when possibly duplicated orders are detected.
 */
class WooCommerce_Duplicate_Orders {
	const CRON_HOOK_NAME = 'newspack_wc_check_order_series';
	const ADMIN_NOTICE_TRANSIENT_NAME = 'newspack_wc_check_order_series_admin_notice';
	const DUPLICATED_ORDERS_OPTION_NAME = 'newspack_wc_order_series';
	const DISMISSED_DUPLICATE_ORDER_META_NAME = '_newspack_dismissed_duplicate';

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init(): void {
		if ( ! wp_next_scheduled( self::CRON_HOOK_NAME ) ) {
			wp_schedule_event( time(), 'daily', self::CRON_HOOK_NAME );
		}
		add_action( self::CRON_HOOK_NAME, [ __CLASS__, 'check_for_order_series' ] );
		add_action( 'admin_notices', [ __CLASS__, 'display_admin_notice' ] );
	}

	/**
	 * Is this site using HPOS?
	 */
	private static function is_using_hpos(): bool {
		return class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) && \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();
	}

	/**
	 * Detect duplicate orders.
	 * An order series will be detected if it the same amount, same day, from the same customer,
	 * in the time span provided in the argument (in minutes).
	 *
	 * @param int $series_interval The interval to consider for matching transactions.
	 */
	public static function detect_order_series( $series_interval = 10 ): array {
		global $wpdb;

		if ( self::is_using_hpos() ) {
			$query = "
			SELECT
				o_billing.email AS email,
				DATE(o.date_created_gmt) AS date,
				o.total_amount AS amount,
				GROUP_CONCAT(o.id) AS ids
			FROM {$wpdb->prefix}wc_orders AS o
			JOIN {$wpdb->prefix}wc_order_addresses AS o_billing
				ON o.id = o_billing.order_id AND o_billing.address_type = 'billing'
			LEFT JOIN {$wpdb->prefix}wc_orders_meta AS o_meta
				ON o.id = o_meta.order_id AND o_meta.meta_key = '_subscription_renewal'
			WHERE o_billing.email IS NOT NULL
				AND o.total_amount > 0.00
				AND o.status = 'wc-completed'
				AND o_meta.order_id IS NULL
				AND o.id NOT IN (
					SELECT order_id
					FROM {$wpdb->prefix}wc_orders_meta
					WHERE meta_key = '" . self::DISMISSED_DUPLICATE_ORDER_META_NAME . "' AND meta_value = '1'
				)
				AND EXISTS (
					SELECT 1
					FROM {$wpdb->prefix}wc_orders AS o2
					JOIN {$wpdb->prefix}wc_order_addresses AS o2_billing
						ON o2.id = o2_billing.order_id AND o2_billing.address_type = 'billing'
					WHERE o2_billing.email = o_billing.email
					  AND o2.total_amount = o.total_amount
					  AND ABS(TIMESTAMPDIFF(MINUTE, o2.date_created_gmt, o.date_created_gmt)) <= $series_interval
					  AND o2.id != o.id
				)
			GROUP BY o_billing.email, DATE(o.date_created_gmt), o.total_amount
			HAVING COUNT(*) > 1 -- Ensures only duplicates are included
			";
		} else {
			$query = "
			SELECT
				pm_email.meta_value AS email,
				DATE(p.post_date) AS date,
				pm_amount.meta_value AS amount,
				GROUP_CONCAT(p.ID) AS ids
			FROM {$wpdb->posts} AS p
			JOIN {$wpdb->postmeta} AS pm_email
				ON p.ID = pm_email.post_id
			JOIN {$wpdb->postmeta} AS pm_amount
				ON p.ID = pm_amount.post_id
			LEFT JOIN {$wpdb->postmeta} AS pm_renewal
				ON p.ID = pm_renewal.post_id AND pm_renewal.meta_key = '_subscription_renewal'
			WHERE p.post_type = 'shop_order'
				AND p.post_status = 'wc-completed'
				AND pm_email.meta_key = '_billing_email'
				AND p.ID NOT IN (
					SELECT post_id
					FROM {$wpdb->postmeta}
					WHERE meta_key = '" . self::DISMISSED_DUPLICATE_ORDER_META_NAME . "' AND meta_value = '1'
				)
				AND pm_amount.meta_key = '_order_total'
				AND CAST(pm_amount.meta_value AS DECIMAL(10,2)) > 0.00
				AND pm_renewal.post_id IS NULL
				AND EXISTS (
					SELECT 1
					FROM {$wpdb->posts} AS p2
					WHERE p2.post_type = 'shop_order'
					AND pm_email.meta_value = (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p2.ID AND meta_key = '_billing_email')
					AND pm_amount.meta_value = (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p2.ID AND meta_key = '_order_total')
					AND ABS(TIMESTAMPDIFF(MINUTE, p2.post_date, p.post_date)) <= $series_interval
					AND p2.ID != p.ID
				)
			GROUP BY pm_email.meta_value, DATE(p.post_date), pm_amount.meta_value
			HAVING COUNT(*) > 1 -- Ensures only duplicates are included
			";
		}

		return $wpdb->get_results( $query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery
	}

	/**
	 * Add an admin notice about the detected order series.
	 */
	public static function check_for_order_series(): void {
		$order_series = self::detect_order_series();
		if ( empty( $order_series ) ) {
			return;
		}
		update_option( self::DUPLICATED_ORDERS_OPTION_NAME, $order_series );
	}

	/**
	 * Display an admin notice if duplicate orders are found.
	 */
	public static function display_admin_notice(): void {
		if ( ! function_exists( 'wc_price' ) ) {
			return;
		}
		$order_series = get_option( self::DUPLICATED_ORDERS_OPTION_NAME, [] );
		?>
		<div class="notice notice-info is-dismissible">
			<!-- Admin notice added by newspack-plugin -->
			<details>
				<summary style="margin: 0.6em 0; cursor: pointer;">
					<?php echo esc_html__( 'There are some potentially duplicate transactions to review. Some of these might be intentional. Click this message to display the list of possible duplicates.', 'newspack-plugin' ); ?>
				</summary>
				<ul>
					<?php foreach ( $order_series as $order_series ) : ?>
						<li style="display: flex; align-items: center;">
							<p style="margin: 0;">

							<?php
							ob_start();
							?>
								<a href="<?php echo esc_url( admin_url( 'edit.php?s=' . urlencode( $order_series['email'] ) . '&post_type=shop_order' ) ); ?>"><?php echo esc_html( $order_series['email'] ); ?></a>
							<?php
							$customer_email = ob_get_clean();

							ob_start();
							$order_ids = explode( ',', $order_series['ids'] );
							foreach ( $order_ids as $index => $order_id ) :
								$order_url = admin_url( 'post.php?post=' . intval( $order_id ) . '&action=edit' );
								?>
									<a href="<?php echo esc_url( $order_url ); ?>"><?php echo esc_html( $order_id ); ?></a><?php echo ( $index < count( $order_ids ) - 1 ) ? ', ' : ''; ?>
								<?php
							endforeach;
							$order_list = ob_get_clean();

							printf(
								/* translators: 1: customer email, 2: order amount, 3: orders date, 4: order IDs */
								wp_kses_post( __( 'Customer %1$s made multiple orders of %2$s on %3$s. Orders: %4$s.', 'newspack-plugin' ) ),
								wp_kses_post( $customer_email ),
								wp_kses_post( \wc_price( $order_series['amount'] ) ),
								esc_html( date_i18n( get_option( 'date_format' ), strtotime( $order_series['date'] ) ) ),
								wp_kses_post( trim( $order_list ) )
							);

							$order_series_id = implode( '-', $order_ids );
						?>
							</p>
							<form method="post" style="display:inline; margin-left: 8px;">
								<input type="hidden" name="dismiss_order_ids" value="<?php echo esc_attr( $order_series['ids'] ); ?>">
								<?php submit_button( __( 'Dismiss', 'newspack-plugin' ), 'small', 'dismiss_order', false, [ 'id' => 'dismiss_order_series_' . $order_series_id ] ); ?>
							</form>
						</li>
					<?php endforeach; ?>
				</ul>
			</details>
		</div>
		<?php
		if ( isset( $_POST['dismiss_order'] ) && isset( $_POST['dismiss_order_ids'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$order_ids = explode( ',', sanitize_text_field( wp_unslash( $_POST['dismiss_order_ids'] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			foreach ( $order_ids as $order_id ) {
				$wc_order = \wc_get_order( $order_id );
				if ( $wc_order ) {
					$wc_order->add_meta_data( self::DISMISSED_DUPLICATE_ORDER_META_NAME, 1 );
					$wc_order->save();
				}
			}
			self::check_for_order_series();
			// Refresh the page to reflect changes.
			wp_safe_redirect( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : admin_url() );
			exit;
		}
	}
}

WooCommerce_Duplicate_Orders::init();
