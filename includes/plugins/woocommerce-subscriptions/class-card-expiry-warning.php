<?php
/**
 * Card Expiry Warning Email.
 *
 * Sends a warning email when a reader's saved credit card is about to expire
 * on an active WooCommerce Subscription. Runs a daily cron scan to find
 * expiring CC tokens and notifies the subscription owner.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Card Expiry Warning class.
 */
class Card_Expiry_Warning {

	/**
	 * Email type identifier used in the Newspack email config system.
	 */
	const EMAIL_TYPE = 'card-expiry-warning';

	/**
	 * Cron hook name for the daily expiry scan.
	 */
	const CRON_HOOK = 'newspack_card_expiry_warning_scan';

	/**
	 * Subscription meta key for idempotency tracking.
	 */
	const SENT_META = '_newspack_card_expiry_warning_sent';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( ! WooCommerce_Subscriptions::is_enabled() ) {
			return;
		}

		add_filter( 'newspack_email_configs', [ __CLASS__, 'add_email_config' ] );
		add_action( 'init', [ __CLASS__, 'schedule_cron' ] );
		add_action( self::CRON_HOOK, [ __CLASS__, 'scan_expiring_cards' ] );
		add_action( 'woocommerce_subscription_payment_method_updated', [ __CLASS__, 'clear_sent_flag' ] );
		add_action( 'newspack_deactivation', [ __CLASS__, 'unschedule_cron' ] );
	}

	/**
	 * Unschedule the cron event on plugin deactivation.
	 */
	public static function unschedule_cron() {
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	/**
	 * Get the number of days before expiry to send the warning.
	 *
	 * @return int Days before card expiry.
	 */
	public static function get_days_before_expiry(): int {
		/**
		 * Filters the number of days before card expiry to send the warning email.
		 *
		 * @param int $days Default 14.
		 */
		return max( 1, (int) apply_filters( 'newspack_card_expiry_warning_days', 14 ) );
	}

	/**
	 * Register the email configuration.
	 *
	 * @param array $configs Existing email configs.
	 * @return array Modified email configs.
	 */
	public static function add_email_config( $configs ) {
		$configs[ self::EMAIL_TYPE ] = [
			'name'                   => self::EMAIL_TYPE,
			'category'               => 'reader-revenue',
			'label'                  => __( 'Card expiry warning', 'newspack-plugin' ),
			'description'            => __( "Email sent when a reader's saved payment method is about to expire.", 'newspack-plugin' ),
			'template'               => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-revenue-emails/card-expiry-warning.php',
			'editor_notice'          => __( 'This email will be sent to readers when their saved credit card is about to expire on an active subscription.', 'newspack-plugin' ),
			'from_email'             => Reader_Revenue_Emails::get_from_email(),
			'available_placeholders' => [
				[
					'label'    => __( 'the customer billing first name', 'newspack-plugin' ),
					'template' => '*BILLING_FIRST_NAME*',
				],
				[
					'label'    => __( 'the last four digits of the expiring card', 'newspack-plugin' ),
					'template' => '*CARD_LAST_4*',
				],
				[
					'label'    => __( 'the card expiry date (MM/YYYY)', 'newspack-plugin' ),
					'template' => '*EXPIRY_DATE*',
				],
				[
					'label'    => __( 'the next renewal date', 'newspack-plugin' ),
					'template' => '*RENEWAL_DATE*',
				],
				[
					'label'    => __( 'link to update payment method', 'newspack-plugin' ),
					'template' => '*UPDATE_PAYMENT_URL*',
				],
				[
					'label'    => __(
						'the contact email to your site (same as the "From" email address)',
						'newspack-plugin'
					),
					'template' => '*CONTACT_EMAIL*',
				],
				[
					'label'    => __( 'the site title', 'newspack-plugin' ),
					'template' => '*SITE_TITLE*',
				],
				[
					'label'    => __( 'the site url', 'newspack-plugin' ),
					'template' => '*SITE_URL*',
				],
			],
		];
		return $configs;
	}

	/**
	 * Schedule the daily cron event if not already scheduled.
	 */
	public static function schedule_cron() {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time(), 'daily', self::CRON_HOOK );
		}
	}

	/**
	 * Scan for expiring credit cards and send warning emails.
	 *
	 * Token-first approach: query CC tokens expiring within the warning window,
	 * then find active subscriptions using each token via WCS_Payment_Tokens.
	 */
	public static function scan_expiring_cards() {
		if ( ! Emails::can_send_email( self::EMAIL_TYPE ) ) {
			return;
		}
		$days = self::get_days_before_expiry();

		// 1. Find CC tokens expiring within the warning window.
		$expiring_tokens = self::get_expiring_cc_tokens( $days );
		if ( empty( $expiring_tokens ) ) {
			return;
		}

		// 2. For each expiring token, find active subscriptions using it.
		if ( ! class_exists( 'WCS_Payment_Tokens' ) ) {
			return;
		}
		foreach ( $expiring_tokens as $token ) {
			$subscription_ids = \WCS_Payment_Tokens::get_subscriptions_from_token( $token );
			foreach ( $subscription_ids as $subscription_id ) {
				$subscription = WooCommerce_Subscriptions::sanitize_subscription( $subscription_id );
				if ( ! $subscription || 'active' !== $subscription->get_status() ) {
					continue;
				}
				self::maybe_send_warning( $subscription, $token );
			}
		}
	}

	/**
	 * Find CC tokens expiring within the given number of days.
	 *
	 * Direct DB query on woocommerce_payment_tokenmeta joined to
	 * woocommerce_payment_tokens to filter at the DB level.
	 *
	 * @param int $days Number of days in the warning window.
	 * @return \WC_Payment_Token_CC[] Array of expiring CC token objects.
	 */
	private static function get_expiring_cc_tokens( int $days ): array {
		global $wpdb;

		$today  = gmdate( 'Y-m-d' );
		$cutoff = gmdate( 'Y-m-d', time() + $days * DAY_IN_SECONDS );

		// A card with expiry MM/YYYY is valid through the last day of that month.
		// Find tokens whose last-valid-day falls between today and $cutoff.
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$token_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT t.token_id
				FROM {$wpdb->prefix}woocommerce_payment_tokens t
				INNER JOIN {$wpdb->prefix}woocommerce_payment_tokenmeta em
					ON em.payment_token_id = t.token_id AND em.meta_key = 'expiry_month'
				INNER JOIN {$wpdb->prefix}woocommerce_payment_tokenmeta ey
					ON ey.payment_token_id = t.token_id AND ey.meta_key = 'expiry_year'
				WHERE t.type = 'CC'
					AND LAST_DAY(
						STR_TO_DATE(
							CONCAT(ey.meta_value, '-', em.meta_value, '-01'),
							'%%Y-%%m-%%d'
						)
					) BETWEEN %s AND %s",
				$today,
				$cutoff
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		if ( empty( $token_ids ) ) {
			return [];
		}

		$tokens = [];
		foreach ( $token_ids as $token_id ) {
			$token = \WC_Payment_Tokens::get( (int) $token_id );
			if ( $token instanceof \WC_Payment_Token_CC ) {
				$tokens[] = $token;
			}
		}
		return $tokens;
	}

	/**
	 * Send the expiry warning for a subscription if not already sent.
	 *
	 * Uses per-subscription meta for idempotency: the meta value encodes
	 * the token ID and expiry date, so it auto-invalidates when the
	 * payment method changes or for a new expiry cycle.
	 *
	 * @param \WC_Subscription     $subscription The subscription.
	 * @param \WC_Payment_Token_CC $token        The expiring CC token.
	 */
	private static function maybe_send_warning( $subscription, $token ) {
		$expiry_key = $token->get_id() . ':'
			. $token->get_expiry_month() . '/' . $token->get_expiry_year();

		// Idempotency: skip if we already sent for this token+expiry combo.
		if ( $subscription->get_meta( self::SENT_META, true ) === $expiry_key ) {
			return;
		}

		$customer = $subscription->get_user();
		if ( ! $customer ) {
			return;
		}

		$update_url   = \wc_get_account_endpoint_url( 'payment-methods' );
		$next_payment = $subscription->get_date( 'next_payment' );
		$renewal_date = $next_payment
			? date_i18n( get_option( 'date_format', 'F j, Y' ), $subscription->get_time( 'next_payment' ) )
			: __( 'your next renewal', 'newspack-plugin' );

		$first_name = $subscription->get_billing_first_name();
		if ( '' === $first_name ) {
			$first_name = $customer->first_name;
		}

		$placeholders = [
			[
				'template' => '*BILLING_FIRST_NAME*',
				'value'    => esc_html( $first_name ),
			],
			[
				'template' => '*CARD_LAST_4*',
				'value'    => esc_html( $token->get_last4() ),
			],
			[
				'template' => '*EXPIRY_DATE*',
				'value'    => esc_html( $token->get_expiry_month() . '/' . $token->get_expiry_year() ),
			],
			[
				'template' => '*RENEWAL_DATE*',
				'value'    => esc_html( $renewal_date ),
			],
			[
				'template' => '*UPDATE_PAYMENT_URL*',
				'value'    => esc_url( $update_url ),
			],
		];

		$sent = Emails::send_email(
			self::EMAIL_TYPE,
			$subscription->get_billing_email(),
			$placeholders
		);

		if ( $sent ) {
			$subscription->update_meta_data( self::SENT_META, $expiry_key );
			$subscription->save();
		}
	}

	/**
	 * Clear the sent flag when the payment method is updated on a subscription.
	 *
	 * Hooked to 'woocommerce_subscription_payment_method_updated'.
	 *
	 * @param \WC_Subscription $subscription The subscription.
	 */
	public static function clear_sent_flag( $subscription ) {
		$subscription->delete_meta_data( self::SENT_META );
		$subscription->save();
	}
}
