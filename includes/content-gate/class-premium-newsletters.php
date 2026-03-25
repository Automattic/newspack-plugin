<?php
/**
 * Premium Newsletters.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack_Newsletters_Contacts;
use Newspack_Newsletters_Subscription;
use Newspack\Newsletters\Subscription_List;

defined( 'ABSPATH' ) || exit;

/**
 * Premium Newsletters Wizard.
 */
class Premium_Newsletters {
	/**
	 * Initialize.
	 */
	public static function init() {
		// Filter the subscription lists.
		add_filter( 'newspack_newsletters_subscription_lists', [ __CLASS__, 'filter_subscription_lists' ] );

		// Register Data Events handlers.
		add_action( 'init', [ __CLASS__, 'register_handlers' ] );
	}

	/**
	 * Register Data Events handlers.
	 */
	public static function register_handlers() {
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_user_to_lists' ], 'subscription_payment_complete' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_remove_user_from_lists' ], 'subscription_renewal_payment_failed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_remove_user_from_lists' ], 'product_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_remove_user_from_lists' ], 'donation_subscription_changed' );
	}

	/**
	 * Filter the subscription lists to prevent premium newsletters from being shown when restricted.
	 *
	 * @param array $lists The lists.
	 *
	 * @return array The filtered lists.
	 */
	public static function filter_subscription_lists( $lists ) {
		$lists = array_values(
			array_filter(
				$lists,
				function( $list ) {
					return ! Content_Restriction_Control::is_post_restricted( false, $list->get_id() );
				}
			)
		);
		return $lists;
	}

	/**
	 * Get the lists restricted, optionally filtered by particular products.
	 *
	 * @param array|int|null $product_ids The product ID or IDs, or null to get all restricted lists.
	 *
	 * @return array The lists.
	 */
	public static function get_restricted_lists_by_products( $product_ids = null ) {
		if ( ! class_exists( 'Newspack\Newsletters\Subscription_List' ) ) {
			return [];
		}
		if ( null !== $product_ids && ! is_array( $product_ids ) ) {
			$product_ids = [ $product_ids ];
		}
		$gates             = Content_Gate::get_gates( Content_Gate::GATE_CPT, null, true );
		$restricted_lists  = [];
		foreach ( $gates as $gate ) {
			$custom_access = $gate['custom_access'];
			if ( empty( $custom_access['active'] ) ) {
				continue;
			}
			$requires_subscription = false;
			$access_rule_groups    = $custom_access['access_rules'];
			foreach ( $access_rule_groups as $access_rule_group ) {
				foreach ( $access_rule_group as $access_rule ) {
					if ( $access_rule['slug'] === 'subscription' ) {
						if ( ! empty( $product_ids ) && empty( array_intersect( $product_ids, $access_rule['value'] ) ) ) {
							continue 2;
						}
						$requires_subscription = true;
					}
				}
			}
			if ( ! $requires_subscription ) {
				continue;
			}
			$content_rules = array_filter(
				Content_Rules::get_gate_content_rules( $gate['id'] ),
				function ( $content_rule ) {
					return $content_rule['slug'] === 'newsletters';
				}
			);
			$restricted_lists = array_merge( $restricted_lists, array_merge( ...array_column( $content_rules, 'value' ) ) );
		}

		// Map list post IDs to public ESP IDs.
		$restricted_lists = array_values( array_unique( $restricted_lists ) );
		$restricted_lists = array_map(
			function( $list_id ) {
				$list = new Subscription_List( $list_id );
				if ( ! $list ) {
					return null;
				}
				return $list->get_public_id();
			},
			$restricted_lists
		);
		return $restricted_lists;
	}

	/**
	 * Add a user to the given lists.
	 *
	 * @param string   $email The email address of the user.
	 * @param string[] $lists The list IDs to add the user to.
	 * @param string   $context The context of the action.
	 *
	 * @return void
	 */
	private static function add_user_to_lists( $email, $lists, $context = 'Adding user to premium newsletter lists' ) {
		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) || ! class_exists( 'Newspack_Newsletters_Subscription' ) ) {
			return;
		}
		if ( empty( $lists ) ) {
			return;
		}

		// No need to add the user to lists they are already subscribed to.
		$current_lists = Newspack_Newsletters_Subscription::get_contact_lists( $email );
		$lists         = array_values( array_diff( $lists, $current_lists ) );
		if ( empty( $lists ) ) {
			return;
		}

		Newspack_Newsletters_Contacts::add_and_remove_lists( $email, $lists, [], $context );
	}

	/**
	 * Remove the user from the given lists.
	 *
	 * @param string   $email The email address of the user.
	 * @param string[] $lists The list IDs to remove the user from.
	 * @param string   $context The context of the action.
	 *
	 * @return void
	 */
	private static function remove_user_from_lists( $email, $lists, $context = 'Removing user from premium newsletter lists' ) {
		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
			return;
		}
		if ( empty( $lists ) ) {
			return;
		}
		Newspack_Newsletters_Contacts::add_and_remove_lists( $email, [], $lists, $context );
	}

	/**
	 * If the auto-signup option is enabled, add the user to the lists.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function maybe_add_user_to_lists( $timestamp, $data, $client_id ) {
		if ( empty( $data['subscription_id'] ) || empty( $data['email'] ) ) {
			return;
		}
		if ( ! (bool) get_option( 'newspack_premium_newsletters_auto_signup', 1 ) ) {
			return;
		}
		$product_ids = $data['product_ids'] ?? WooCommerce_Subscriptions::get_subscription_product_id( $data['subscription_id'] );
		self::add_user_to_lists(
			$data['email'],
			self::get_restricted_lists_by_products( $product_ids ),
			sprintf(
				'Adding user to premium newsletter lists after purchase or renewal of subscription with ID: %s',
				$data['subscription_id']
			)
		);
	}

	/**
	 * Remove the user from the lists.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function maybe_remove_user_from_lists( $timestamp, $data, $client_id ) {
		if ( empty( $data['subscription_id'] ) || empty( $data['email'] ) ) {
			return;
		}
		if ( ! empty( $data['status_after'] ) && ! in_array( $data['status_after'], [ 'cancelled', 'expired' ], true ) ) {
			return;
		}
		$product_ids = $data['product_ids'] ?? WooCommerce_Subscriptions::get_subscription_product_id( $data['subscription_id'] );
		self::remove_user_from_lists(
			$data['email'],
			self::get_restricted_lists_by_products( $product_ids ),
			sprintf(
				'Removing user from premium newsletter lists after change to subscription with ID: %s',
				$data['subscription_id']
			)
		);
	}
}

Premium_Newsletters::init();
