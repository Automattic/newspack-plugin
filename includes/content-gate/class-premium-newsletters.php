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
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'subscription_payment_complete' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'subscription_renewal_payment_failed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'product_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'donation_subscription_changed' );
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
	 * Add a user to the given lists.
	 *
	 * @param string   $email The email address of the user.
	 * @param string[] $lists The list IDs to add the user to.
	 * @param string   $context The context of the action.
	 *
	 * @return void
	 */
	private static function add_user_to_lists( $email, $lists, $context = 'Adding user to premium newsletter lists' ) {
		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) || ! class_exists( 'Newspack_Newsletters_Subscription' ) || ! class_exists( 'Newspack\Newsletters\Subscription_List' ) ) {
			return;
		}
		if ( empty( $lists ) ) {
			return;
		}
		$lists = array_map(
			function( $list_id ) {
				$list = new Subscription_List( $list_id );
				if ( ! $list ) {
					return null;
				}
				return $list->get_public_id();
			},
			$lists
		);

		// No need to add the user to lists they are already subscribed to.
		$current_lists = Newspack_Newsletters_Subscription::get_contact_lists( $email );
		$lists = array_values( array_diff( $lists, $current_lists ) );
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
		$lists = array_map(
			function( $list_id ) {
				$list = new Subscription_List( $list_id );
				if ( ! $list ) {
					return null;
				}
				return $list->get_public_id();
			},
			$lists
		);
		Newspack_Newsletters_Contacts::add_and_remove_lists( $email, [], $lists, $context );
	}

	/**
	 * Maybe add or remove the user from restricted lists based on their access status.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function maybe_add_or_remove_lists( $timestamp, $data, $client_id ) {
		if ( empty( $data['user_id'] ) || empty( $data['email'] ) ) {
			return;
		}
		$gates = Content_Gate::get_gates( Content_Gate::GATE_CPT, 'publish', true );
		if ( empty( $gates ) ) {
			return;
		}
		$lists_to_add    = [];
		$lists_to_remove = [];
		foreach ( $gates as $gate ) {
			$content_rules = array_values(
				array_filter(
					Content_Rules::get_gate_content_rules( $gate['id'] ),
					function ( $content_rule ) {
						return $content_rule['slug'] === 'newsletters';
					}
				)
			);
			if ( empty( $content_rules ) ) {
				continue;
			}
			$restricted_lists = array_values(
				array_unique(
					array_merge(
						...array_column( $content_rules, 'value' )
					)
				)
			);
			if ( empty( $restricted_lists ) ) {
				continue;
			}
			$custom_access = Content_Gate::get_custom_access_settings( $gate['id'] );
			if ( empty( $custom_access['active'] ) ) {
				continue;
			}
			if ( empty( $custom_access['access_rules'] ) ) {
				continue;
			}

			// If the user does not have access to restricted lists, remove them.
			if ( ! Access_Rules::evaluate_rules( $custom_access['access_rules'], $data['user_id'] ) ) {
				$lists_to_remove = array_values( array_unique( array_merge( $lists_to_remove, $restricted_lists ) ) );
			} elseif ( (bool) get_option( 'newspack_premium_newsletters_auto_signup', 1 ) ) {
				// If the user has access to restricted lists and auto signup is enabled, add them to the lists.
				$lists_to_add = array_values( array_unique( array_merge( $lists_to_add, $restricted_lists ) ) );
			}
		}

		// Don't remove the user from the lists they have access to from other gates.
		$lists_to_remove = array_values( array_diff( $lists_to_remove, $lists_to_add ) );

		self::add_user_to_lists( $data['email'], $lists_to_add );
		self::remove_user_from_lists( $data['email'], $lists_to_remove );
	}
}

Premium_Newsletters::init();
