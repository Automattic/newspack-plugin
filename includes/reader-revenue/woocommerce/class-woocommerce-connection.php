<?php
/**
 * Connection with WooCommerce's features.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Connection with WooCommerce's features.
 */
class WooCommerce_Connection {
	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		include_once __DIR__ . '/class-woocommerce-order-utm.php';
		include_once __DIR__ . '/class-woocommerce-cover-fees.php';
		include_once __DIR__ . '/class-woocommerce-cli.php';

		\add_action( 'admin_init', [ __CLASS__, 'disable_woocommerce_setup' ] );
		\add_filter( 'option_woocommerce_subscriptions_allow_switching', [ __CLASS__, 'force_allow_subscription_switching' ], 10, 2 );
		\add_filter( 'option_woocommerce_subscriptions_allow_switching_nyp_price', [ __CLASS__, 'force_allow_subscription_switching' ], 10, 2 );
		\add_filter( 'option_woocommerce_subscriptions_enable_retry', [ __CLASS__, 'force_allow_failed_payment_retry' ] );
		\add_filter( 'default_option_woocommerce_subscriptions_allow_switching', [ __CLASS__, 'force_allow_subscription_switching' ], 10, 2 );
		\add_filter( 'default_option_woocommerce_subscriptions_allow_switching_nyp_price', [ __CLASS__, 'force_allow_subscription_switching' ], 10, 2 );
		\add_filter( 'default_option_woocommerce_subscriptions_enable_retry', [ __CLASS__, 'force_allow_failed_payment_retry' ] );
		\add_filter( 'woocommerce_email_enabled_customer_completed_order', [ __CLASS__, 'send_customizable_receipt_email' ], 10, 3 );
		\add_action( 'cli_init', [ __CLASS__, 'register_cli_commands' ] );

		// WooCommerce Subscriptions.
		\add_filter( 'wc_stripe_generate_payment_request', [ __CLASS__, 'stripe_gateway_payment_request_data' ], 10, 2 );

		\add_action( 'woocommerce_payment_complete', [ __CLASS__, 'order_paid' ], 101 );
		\add_action( 'option_woocommerce_subscriptions_failed_scheduled_actions', [ __CLASS__, 'filter_subscription_scheduled_actions_errors' ] );
	}

	/**
	 * Register CLI command
	 *
	 * @return void
	 */
	public static function register_cli_commands() {
		\WP_CLI::add_command( 'newspack-woocommerce', 'Newspack\\WooCommerce_Cli' );
	}

	/**
	 * Hide WooCommerce's setup task list. Newspack does the setup behind the scenes.
	 */
	public static function disable_woocommerce_setup() {
		if ( class_exists( '\Automattic\WooCommerce\Admin\Features\OnboardingTasks\TaskLists' ) ) {
			$task_list = \Automattic\WooCommerce\Admin\Features\OnboardingTasks\TaskLists::get_list( 'setup' );
			if ( $task_list ) {
				$task_list->hide();
			}
		}
	}

	/**
	 * Donations actions when order is processed.
	 *
	 * @param int $order_id Order ID.
	 */
	public static function order_paid( $order_id ) {
		$product_id = Donations::get_order_donation_product_id( $order_id );

		/** Bail if not a donation order. */
		if ( false === $product_id ) {
			return;
		}

		/**
		 * Fires when a donation order is processed.
		 *
		 * @param int $order_id   Order post ID.
		 * @param int $product_id Donation product post ID.
		 */
		\do_action( 'newspack_donation_order_processed', $order_id, $product_id );
	}

	/**
	 * Get the contact data from a WooCommerce order.
	 *
	 * @param \WC_Order|int $order WooCommerce order or order ID.
	 * @param bool|string   $payment_page_url Payment page URL. If not provided, checkout URL will be used.
	 * @param bool          $is_new Whether the order is new and should count towards the contact's total spent value.
	 *
	 * @return array|false Contact data or false.
	 */
	public static function get_contact_from_order( $order, $payment_page_url = false, $is_new = false ) {
		if ( ! is_a( $order, 'WC_Order' ) ) {
			$order = new \WC_Order( $order );
		}

		if ( ! self::should_sync_order( $order ) ) {
			return;
		}

		$user_id = $order->get_customer_id();
		if ( ! $user_id ) {
			return false;
		}

		$customer = new \WC_Customer( $user_id );

		$metadata[ Newspack_Newsletters::get_metadata_key( 'account' ) ]           = $order->get_customer_id();
		$metadata[ Newspack_Newsletters::get_metadata_key( 'registration_date' ) ] = $customer->get_date_created()->date( Newspack_Newsletters::METADATA_DATE_FORMAT );

		$referer_from_order = $order->get_meta( '_newspack_referer' );
		if ( empty( $referer_from_order ) ) {
			$payment_page_url = \wc_get_checkout_url();
		} else {
			$payment_page_url = $referer_from_order;
		}
		$metadata['payment_page'] = $payment_page_url;

		$utm = $order->get_meta( 'utm' );
		if ( ! empty( $utm ) ) {
			foreach ( $utm as $key => $value ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'payment_page_utm' ) . $key ] = $value;
			}
		}

		$order_subscriptions = wcs_get_subscriptions_for_order( $order->get_id(), [ 'order_type' => 'any' ] );
		$is_donation_order   = Donations::is_donation_order( $order );

		// One-time transaction.
		if ( empty( $order_subscriptions ) ) {
			if ( $is_donation_order ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'membership_status' ) ] = 'Donor';
			}
			$metadata[ Newspack_Newsletters::get_metadata_key( 'total_paid' ) ] = (float) $customer->get_total_spent();

			if ( $is_new && 'pending' === $order->get_status() ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'total_paid' ) ] += (float) $order->get_total();
			}

			$metadata[ Newspack_Newsletters::get_metadata_key( 'product_name' ) ] = '';
			$order_items = $order->get_items();
			if ( $order_items ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'product_name' ) ] = reset( $order_items )->get_name();
			}
			$metadata[ Newspack_Newsletters::get_metadata_key( 'last_payment_amount' ) ] = $order->get_total();
			$order_date_paid = $order->get_date_paid();
			if ( null !== $order_date_paid ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'last_payment_date' ) ] = $order_date_paid->date( Newspack_Newsletters::METADATA_DATE_FORMAT );
			}

			// Subscription transaction.
		} else {
			$current_subscription = reset( $order_subscriptions );

			if ( $is_donation_order ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'membership_status' ) ] = 'Donor';
				if ( 'active' === $current_subscription->get_status() || 'pending' === $current_subscription->get_status() ) {
					if ( 'month' === $current_subscription->get_billing_period() ) {
						$metadata[ Newspack_Newsletters::get_metadata_key( 'membership_status' ) ] = 'Monthly Donor';
					}

					if ( 'year' === $current_subscription->get_billing_period() ) {
						$metadata[ Newspack_Newsletters::get_metadata_key( 'membership_status' ) ] = 'Yearly Donor';
					}
				} else {
					if ( 'month' === $current_subscription->get_billing_period() ) {
						$metadata[ Newspack_Newsletters::get_metadata_key( 'membership_status' ) ] = 'Ex-Monthly Donor';
					}

					if ( 'year' === $current_subscription->get_billing_period() ) {
						$metadata[ Newspack_Newsletters::get_metadata_key( 'membership_status' ) ] = 'Ex-Yearly Donor';
					}
				}
			}

			$metadata[ Newspack_Newsletters::get_metadata_key( 'sub_start_date' ) ]      = $current_subscription->get_date( 'start' );
			$metadata[ Newspack_Newsletters::get_metadata_key( 'sub_end_date' ) ]        = $current_subscription->get_date( 'end' ) ? $current_subscription->get_date( 'end' ) : '';
			$metadata[ Newspack_Newsletters::get_metadata_key( 'billing_cycle' ) ]       = $current_subscription->get_billing_period();
			$metadata[ Newspack_Newsletters::get_metadata_key( 'recurring_payment' ) ]   = $current_subscription->get_total();
			$metadata[ Newspack_Newsletters::get_metadata_key( 'last_payment_date' ) ]   = $current_subscription->get_date( 'last_order_date_paid' ) ? $current_subscription->get_date( 'last_order_date_paid' ) : gmdate( Newspack_Newsletters::METADATA_DATE_FORMAT );
			$metadata[ Newspack_Newsletters::get_metadata_key( 'last_payment_amount' ) ] = $current_subscription->get_total();

			// When a WC Subscription is terminated, the next payment date is set to 0. We don't want to sync that – the next payment date should remain as it was
			// in the event of cancellation.
			$next_payment_date = $current_subscription->get_date( 'next_payment' );
			if ( $next_payment_date ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'next_payment_date' ) ] = $next_payment_date;
			}

			$metadata[ Newspack_Newsletters::get_metadata_key( 'total_paid' ) ] = (float) $customer->get_total_spent();

			if ( $is_new && 'pending' === $order->get_status() ) {
				$metadata[ Newspack_Newsletters::get_metadata_key( 'total_paid' ) ] += (float) $current_subscription->get_total();
			}

			$metadata[ Newspack_Newsletters::get_metadata_key( 'product_name' ) ] = '';
			if ( $current_subscription ) {
				$subscription_order_items = $current_subscription->get_items();
				if ( $subscription_order_items ) {
					$metadata[ Newspack_Newsletters::get_metadata_key( 'product_name' ) ] = reset( $subscription_order_items )->get_name();
				}
			}
		}

		$first_name = $order->get_billing_first_name();
		$last_name  = $order->get_billing_last_name();
		$full_name  = trim( "$first_name $last_name" );
		$contact    = [
			'email'    => $order->get_billing_email(),
			'metadata' => array_filter( $metadata ),
		];
		if ( ! empty( $full_name ) ) {
			$contact['name'] = $full_name;
		}
		return array_filter( $contact );
	}

	/**
	 * Should an order be synchronized with the integrations?
	 *
	 * @param WC_Order $order Order object.
	 */
	public static function should_sync_order( $order ) {
		if ( $order->get_meta( '_subscription_switch' ) ) {
			// This is a "switch" order, which is just recording a subscription update. It has value of 0 and
			// should not be synced anywhere.
			return false;
		}
		return true;
	}

	/**
	 * Filter post request made by the Stripe Gateway for Stripe payments.
	 *
	 * @param array     $post_data An array of metadata.
	 * @param \WC_Order $order The order object.
	 */
	public static function stripe_gateway_payment_request_data( $post_data, $order ) {
		if ( ! function_exists( 'wcs_get_subscriptions_for_renewal_order' ) ) {
			return $post_data;
		}
		$related_subscriptions = \wcs_get_subscriptions_for_renewal_order( $order );
		if ( ! empty( $related_subscriptions ) ) {
			// In theory, there should be just one subscription per renewal.
			$subscription    = reset( $related_subscriptions );
			$subscription_id = $subscription->get_id();
			// Add subscription ID to any renewal.
			$post_data['metadata']['subscription_id'] = $subscription_id;
			if ( \wcs_order_contains_renewal( $order ) ) {
				$post_data['metadata']['subscription_status'] = 'renewed';
			} else {
				$post_data['metadata']['subscription_status'] = 'created';
			}
		}
		return $post_data;
	}

	/**
	 * Force values for subscription switching options to ON unless the
	 * NEWSPACK_PREVENT_WC_SUBS_ALLOW_SWITCHING_OVERRIDE constant is set.
	 * This affects the following "Allow Switching" options:
	 *
	 * - Between Subscription Variations
	 * - Between Grouped Subscriptions
	 * - Change Name Your Price subscription amount
	 *
	 * @param bool   $can_switch Whether the subscription amount can be switched.
	 * @param string $option_name The name of the option.
	 *
	 * @return string Option value.
	 */
	public static function force_allow_subscription_switching( $can_switch, $option_name ) {
		if ( defined( 'NEWSPACK_PREVENT_WC_SUBS_ALLOW_SWITCHING_OVERRIDE' ) && NEWSPACK_PREVENT_WC_SUBS_ALLOW_SWITCHING_OVERRIDE ) {
			return $can_switch;
		}

		// Subscriptions' default switching options are combined into a single options row with possible values 'no', 'variable', 'grouped', or 'variable_grouped'.
		if ( 'woocommerce_subscriptions_allow_switching' === $option_name ) {
			return 'variable_grouped';
		}

		// Other options added by the woocommerce_subscriptions_allow_switching_options filter are either 'yes' or 'no'.
		return 'yes';
	}

	/**
	 * Force option for allowing retries for failed payments to ON unless the
	 * NEWSPACK_PREVENT_WC_ALLOW_FAILED_PAYMENT_RETRIES_OVERRIDE constant is set.
	 *
	 * See: https://woo.com/document/subscriptions/failed-payment-retry/
	 *
	 * @param bool $should_retry Whether WooCommerce should automatically retry failed payments.
	 *
	 * @return string Option value.
	 */
	public static function force_allow_failed_payment_retry( $should_retry ) {
		if ( defined( 'NEWSPACK_PREVENT_WC_ALLOW_FAILED_PAYMENT_RETRIES_OVERRIDE' ) && NEWSPACK_PREVENT_WC_ALLOW_FAILED_PAYMENT_RETRIES_OVERRIDE ) {
			return $should_retry;
		}

		return 'yes';
	}

	/**
	 * Send the customizable receipt email instead of WooCommerce's default receipt.
	 *
	 * @param bool     $enable Whether to send the default receipt email.
	 * @param WC_Order $order The order object for the receipt email.
	 * @param WC_Email $class Instance of the WC_Email class.
	 *
	 * @return bool
	 */
	public static function send_customizable_receipt_email( $enable, $order, $class ) {
		// If we don't have a valid order, or the customizable email isn't enabled, bail.
		if ( ! is_a( $order, 'WC_Order' ) || ! Emails::can_send_email( Reader_Revenue_Emails::EMAIL_TYPES['RECEIPT'] ) ) {
			return $enable;
		}

		$frequencies = [
			'month' => __( 'Monthly', 'newspack-plugin' ),
			'year'  => __( 'Yearly', 'newspack-plugin' ),
		];
		$product_map = [];
		foreach ( $frequencies as $frequency => $label ) {
			$product_id = Donations::get_donation_product( $frequency );
			if ( $product_id ) {
				$product_map[ $product_id ] = $label;
			}
		}

		$items = $order->get_items();
		$item  = array_shift( $items );

		// Replace content placeholders.
		$placeholders = [
			[
				'template' => '*BILLING_NAME*',
				'value'    => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
			],
			[
				'template' => '*BILLING_FIRST_NAME*',
				'value'    => $order->get_billing_first_name(),
			],
			[
				'template' => '*BILLING_LAST_NAME*',
				'value'    => $order->get_billing_last_name(),
			],
			[
				'template' => '*BILLING_FREQUENCY*',
				'value'    => $product_map[ $item->get_product_id() ] ?? __( 'One-time', 'newspack-plugin' ),
			],
			[
				'template' => '*PRODUCT_NAME*',
				'value'    => $item->get_name(),
			],
			[
				'template' => '*AMOUNT*',
				'value'    => \wp_strip_all_tags( $order->get_formatted_order_total() ),
			],
			[
				'template' => '*DATE*',
				'value'    => $order->get_date_created()->date_i18n(),
			],
			[
				'template' => '*PAYMENT_METHOD*',
				'value'    => __( 'Card', 'newspack-plugin' ) . ' – ' . $order->get_payment_method(),
			],
			[
				'template' => '*RECEIPT_URL*',
				'value'    => sprintf( '<a href="%s">%s</a>', $order->get_view_order_url(), __( 'My Account', 'newspack-plugin' ) ),
			],
		];

		$sent = Emails::send_email(
			Reader_Revenue_Emails::EMAIL_TYPES['RECEIPT'],
			$order->get_billing_email(),
			$placeholders
		);

		return false;
	}

	/**
	 * Get an array of product IDs associated with the given order ID.
	 *
	 * @param int     $order_id Order ID.
	 * @param boolean $include_donations If true, include donation products, otherwise omit them.
	 * @return array Array of product IDs associated with this order.
	 */
	public static function get_products_for_order( $order_id, $include_donations = false ) {
		$product_ids = [];
		if ( ! function_exists( 'wc_get_order' ) ) {
			return $product_ids;
		}

		$order       = \wc_get_order( $order_id );
		$order_items = $order->get_items();

		foreach ( $order_items as $item ) {
			$product_id = $item->get_product_id();
			if ( $include_donations || ! Donations::is_donation_product( $product_id ) ) {
				$product_ids[] = $product_id;
			}
		}

		return $product_ids;
	}
}

WooCommerce_Connection::init();
