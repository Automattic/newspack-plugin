<?php
/**
 * Newspack Group Subscriptions - My Account integration.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * My Account integration class.
 */
class Group_Subscription_MyAccount {
	/**
	 * Manage members endpoint slug.
	 */
	const MANAGE_MEMBERS_ENDPOINT = 'manage-members';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( version_compare( WooCommerce_My_Account::get_version(), '1.0.0', '<' ) ) {
			return;
		}
		add_filter( 'woocommerce_get_query_vars', [ __CLASS__, 'add_manage_members_endpoint' ] );
		add_action( 'woocommerce_account_' . self::MANAGE_MEMBERS_ENDPOINT . '_endpoint', [ __CLASS__, 'render_group_subscription_members_template' ] );
		add_filter( 'wcs_view_subscription_actions', [ __CLASS__, 'view_subscription_actions' ], 13, 3 );
	}

	/**
	 * Get the URL to manage members of a group subscription.
	 *
	 * @param \WC_Subscription $subscription Subscription.
	 *
	 * @return string The URL.
	 */
	public static function get_manage_members_url( $subscription ) {
		return wc_get_account_endpoint_url( self::MANAGE_MEMBERS_ENDPOINT . '/' . $subscription->get_id() );
	}

	/**
	 * Add manage members query var.
	 *
	 * @param array $query_vars Query vars.
	 *
	 * @return array
	 */
	public static function add_manage_members_endpoint( $query_vars ) {
		$query_vars[ self::MANAGE_MEMBERS_ENDPOINT ] = self::MANAGE_MEMBERS_ENDPOINT;
		return $query_vars;
	}

	/**
	 * Render the group subscription members template.
	 */
	public static function render_group_subscription_members_template() {
		$subscription_id = absint( get_query_var( self::MANAGE_MEMBERS_ENDPOINT ) );
		$subscription = WooCommerce_Subscriptions::sanitize_subscription( $subscription_id );
		if ( ! $subscription ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'message'  => __( 'Subscription not found.', 'newspack-plugin' ),
						'is_error' => true,
					],
					wc_get_account_endpoint_url( 'edit-account' )
				)
			);
			exit;
		}
		$user_id = \get_current_user_id();
		if ( ! Group_Subscription::user_is_manager( $user_id, $subscription ) ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'message'  => __( 'You do not have permission to manage subscription.', 'newspack-plugin' ),
						'is_error' => true,
					],
					wc_get_account_endpoint_url( 'edit-account' )
				)
			);
			exit;
		}
		$args = [
			'actions'      => \wcs_get_all_user_actions_for_subscription( $subscription, $user_id ),
			'subscription' => $subscription,
			'view'         => 'manage-members',
		];
		\wc_get_template( 'myaccount/group-subscription-members.php', $args );
	}

	/**
	 * Filter the actions a group manager or member can take on a subscription.
	 *
	 * Only the purchaser of the subscription should see the actions.
	 *
	 * @param array            $actions      Actions.
	 * @param \WC_Subscription $subscription Subscription.
	 * @param int              $user_id      The user ID.
	 *
	 * @return array
	 */
	public static function view_subscription_actions( $actions, $subscription, $user_id ) {
		if ( ! function_exists( 'is_account_page' ) || ! \is_account_page() || $subscription->get_customer_id() !== $user_id || ! Group_Subscription::user_is_manager( $user_id, $subscription ) ) {
			return $actions;
		}
		$actions['manage_members'] = [
			'url'  => self::get_manage_members_url( $subscription ),
			'name' => __( 'Manage Members', 'woocommerce-subscriptions' ),
		];
		return $actions;
	}
}
Group_Subscription_MyAccount::init();
