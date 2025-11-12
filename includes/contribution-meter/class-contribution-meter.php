<?php
/**
 * Newspack Contribution Meter.
 *
 * @package Newspack
 */

namespace Newspack\Contribution_Meter;

use Newspack\Donations;

defined( 'ABSPATH' ) || exit;

/**
 * Handles contribution meter data retrieval and calculations.
 */
class Contribution_Meter {

	/**
	 * REST route for contribution meter.
	 */
	const REST_ROUTE = '/contribution-meter';

	/**
	 * Cache duration in seconds for donation revenue calculations.
	 */
	const CACHE_DURATION = 600;

	/**
	 * Cache key prefix for contribution meter data.
	 */
	const CACHE_KEY_PREFIX = 'newspack_contribution_meter_';

	/**
	 * Initialize hooks and REST API endpoints.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_rest_routes' ] );
	}

	/**
	 * Register REST API routes for the contribution meter.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			self::REST_ROUTE,
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'api_get_contribution_data' ],
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => [
					'startDate' => [
						'required'          => true,
						'type'              => 'string',
						'validate_callback' => [ __CLASS__, 'validate_date' ],
					],
				],
			]
		);
	}

	/**
	 * Validate date format and value.
	 *
	 * @param string $date Date string to validate.
	 * @return bool|WP_Error True if valid, WP_Error if invalid.
	 */
	public static function validate_date( $date ) {
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date ) ) {
			return new \WP_Error( 'invalid_date', __( 'Invalid date format. Expected YYYY-MM-DD.', 'newspack-plugin' ) );
		}
		$date_obj = \DateTime::createFromFormat( 'Y-m-d', $date );
		if ( ! $date_obj || $date_obj->format( 'Y-m-d' ) !== $date ) {
			return new \WP_Error( 'invalid_date', __( 'Invalid date. Please provide a valid date.', 'newspack-plugin' ) );
		}
		return true;
	}

	/**
	 * REST API callback to get contribution data.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public static function api_get_contribution_data( $request ) {
		$start_date = $request->get_param( 'startDate' );
		$data       = self::get_contribution_data( $start_date );

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Get contribution data with caching.
	 *
	 * @param string $start_date Valid start date in YYYY-MM-DD format.
	 * @return array|WP_Error Array of contribution data or WP_Error on failure.
	 */
	public static function get_contribution_data( $start_date ) {
		// Generate cache key based on start date.
		$cache_key = self::CACHE_KEY_PREFIX . md5( $start_date );
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return $cached;
		}

		$amount_raised = self::get_donation_revenue( $start_date );

		if ( is_wp_error( $amount_raised ) ) {
			return $amount_raised;
		}

		$data = [
			'amountRaised' => $amount_raised,
		];

		/**
		 * Filters the expiration time for contribution meter data.
		 *
		 * @param int $expiration Expiration time in seconds.
		 */
		$expiration = apply_filters( 'newspack_contribution_meter_cache_duration', self::CACHE_DURATION );

		set_transient( $cache_key, $data, $expiration );

		return $data;
	}

	/**
	 * Get total donation revenue from a specific start date.
	 *
	 * @param string $start_date Start date in YYYY-MM-DD format.
	 * @return float|WP_Error Total revenue or WP_Error on failure.
	 */
	public static function get_donation_revenue( $start_date ) {
		if ( ! function_exists( 'wc_get_orders' ) || ! function_exists( 'wc_get_order' ) ) {
			return new \WP_Error( 'woocommerce_inactive', __( 'WooCommerce is not active.', 'newspack-plugin' ) );
		}

		// Get all donation product IDs.
		$donation_products    = Donations::get_donation_product_child_products_ids();
		$donation_product_ids = array_filter( array_map( 'intval', array_values( $donation_products ) ) );

		if ( empty( $donation_product_ids ) ) {
			return new \WP_Error( 'no_donation_products', __( 'No donation products found.', 'newspack-plugin' ) );
		}

		return self::get_donation_revenue_via_order_query( $start_date, $donation_product_ids );
	}

	/**
	 * Calculate donation revenue by iterating paginated WooCommerce orders.
	 *
	 * @param string $start_date  Start date in YYYY-MM-DD format.
	 * @param array  $product_ids Donation product IDs to include.
	 * @return float|WP_Error Total revenue or WP_Error on failure.
	 */
	private static function get_donation_revenue_via_order_query( $start_date, $product_ids ) {
		$statuses = apply_filters( 'newspack_contribution_meter_order_statuses', [ 'completed', 'processing' ] );

		$after = self::get_local_wc_datetime( $start_date );

		$query_args = [
			'limit'        => 200,
			'paginate'     => true,
			'orderby'      => 'date',
			'order'        => 'DESC',
			'return'       => 'ids',
			'status'       => $statuses,
			'type'         => 'shop_order',
			'date_created' => '>= ' . $after->date_i18n( 'Y-m-d H:i:s' ),
		];

		$total_revenue = 0.0;
		$page          = 1;
		$max_pages     = 1;

		do {
			$query_args['page'] = $page;
			$results            = wc_get_orders( $query_args );

			if ( is_wp_error( $results ) ) {
				return $results;
			}

			if ( is_object( $results ) ) {
				$orders    = isset( $results->orders ) ? $results->orders : [];
				$max_pages = max( 1, isset( $results->max_num_pages ) ? (int) $results->max_num_pages : 1 );
			} else {
				$orders    = (array) $results;
				$max_pages = 1;
			}

			if ( empty( $orders ) ) {
				break;
			}

			foreach ( $orders as $order_id ) {
				$order = wc_get_order( $order_id );
				if ( ! $order ) {
					continue;
				}

				foreach ( $order->get_items() as $item ) {
					$product_id = $item->get_product_id();
					if ( $product_id && in_array( (int) $product_id, $product_ids, true ) ) {
						$total_revenue += (float) $item->get_total();
					}
				}
			}

			$page++;
		} while ( $page <= $max_pages );

		return $total_revenue;
	}

	/**
	 * Convert a YYYY-MM-DD string into a WC_DateTime in the site's timezone.
	 *
	 * @param string $date Date string.
	 * @return \WC_DateTime
	 */
	private static function get_local_wc_datetime( $date ) {
		$timezone  = new \DateTimeZone( wc_timezone_string() );
		$formatted = false !== strpos( $date, ' ' ) ? $date : $date . ' 00:00:00';
		return new \WC_DateTime( $formatted, $timezone );
	}

	/**
	 * Format currency value.
	 *
	 * @param float $amount Amount to format.
	 * @param array $args Optional formatting arguments.
	 * @return string Formatted currency.
	 */
	public static function format_currency( $amount, $args = [] ) {
		$defaults = [ 'decimals' => 0 ];
		$args     = wp_parse_args( $args, $defaults );

		if ( function_exists( 'wc_price' ) ) {
			return wp_strip_all_tags( wc_price( $amount, $args ) );
		}

		// Fallback formatting.
		$symbol = function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '$';
		return $symbol . number_format( $amount, $args['decimals'], '.', ',' );
	}
}
