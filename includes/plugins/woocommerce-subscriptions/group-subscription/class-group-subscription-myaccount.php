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
	 * Nonce action for the invite member form.
	 */
	const INVITE_NONCE_ACTION = 'newspack_group_subscription_invite';

	/**
	 * Nonce action for the cancel invite form.
	 */
	const CANCEL_INVITE_NONCE_ACTION = 'newspack_group_subscription_cancel_invite';

	/**
	 * Nonce action for the remove member form.
	 */
	const REMOVE_MEMBER_NONCE_ACTION = 'newspack_group_subscription_remove_member';

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
		add_action( 'admin_post_' . self::INVITE_NONCE_ACTION, [ __CLASS__, 'handle_invite_member' ] );
		add_action( 'admin_post_' . self::CANCEL_INVITE_NONCE_ACTION, [ __CLASS__, 'handle_cancel_invite' ] );
		add_action( 'admin_post_' . self::REMOVE_MEMBER_NONCE_ACTION, [ __CLASS__, 'handle_remove_member' ] );
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
			'name' => __( 'Manage members', 'woocommerce-subscriptions' ),
		];
		return $actions;
	}

	/**
	 * Handle the invite member form submission.
	 */
	public static function handle_invite_member() {
		check_admin_referer( self::INVITE_NONCE_ACTION );

		$subscription_id = filter_input( INPUT_POST, 'subscription_id', FILTER_VALIDATE_INT ) ?? 0;
		$redirect_url    = wc_get_account_endpoint_url( self::MANAGE_MEMBERS_ENDPOINT . '/' . $subscription_id );

		$request = new \WP_REST_Request();
		$request->set_param( 'subscription_id', $subscription_id );
		if ( ! Group_Subscription_API::permission_callback( $request ) ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'activeTab' => 'invites',
						'message'   => __( 'You do not have permission to invite members to this group subscription.', 'newspack-plugin' ),
						'is_error'  => true,
					],
					$redirect_url
				)
			);
			exit;
		}

		$email  = filter_input( INPUT_POST, 'newspack-group-subscription-invite-email', FILTER_SANITIZE_EMAIL ) ?? '';
		$invite = Group_Subscription_Invite::generate_invite( $subscription_id, $email );

		if ( is_wp_error( $invite ) ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'activeTab' => 'invites',
						'message'   => $invite->get_error_message(),
						'is_error'  => true,
					],
					$redirect_url
				)
			);
			exit;
		}

		wp_safe_redirect(
			add_query_arg(
				[
					'activeTab'  => 'invites',
					'message'    => sprintf(
						// translators: %s: The invited email address.
						__( '%s has been invited to become a member of this group subscription.', 'newspack-plugin' ),
						$email
					),
					'is_success' => true,
				],
				$redirect_url
			)
		);
		exit;
	}
	/**
	 * Handle the cancel invite form submission.
	 */
	public static function handle_cancel_invite() {
		check_admin_referer( self::CANCEL_INVITE_NONCE_ACTION );

		$subscription_id = filter_input( INPUT_POST, 'subscription_id', FILTER_VALIDATE_INT ) ?? 0;
		$redirect_url    = wc_get_account_endpoint_url( self::MANAGE_MEMBERS_ENDPOINT . '/' . $subscription_id );

		$request = new \WP_REST_Request();
		$request->set_param( 'subscription_id', $subscription_id );
		if ( ! Group_Subscription_API::permission_callback( $request ) ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'activeTab' => 'invites',
						'message'   => __( 'You do not have permission to cancel invitations for this group subscription.', 'newspack-plugin' ),
						'is_error'  => true,
					],
					$redirect_url
				)
			);
			exit;
		}

		$email  = filter_input( INPUT_POST, 'email', FILTER_SANITIZE_EMAIL ) ?? '';
		$result = Group_Subscription_Invite::cancel_invite( $subscription_id, $email );

		if ( is_wp_error( $result ) ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'activeTab' => 'invites',
						'message'   => $result->get_error_message(),
						'is_error'  => true,
					],
					$redirect_url
				)
			);
			exit;
		}

		wp_safe_redirect(
			add_query_arg(
				[
					'activeTab'  => 'invites',
					'message'    => sprintf(
						// translators: %s: The cancelled invitation's email address.
						__( 'The invitation for %s has been cancelled.', 'newspack-plugin' ),
						$email
					),
					'is_success' => true,
				],
				$redirect_url
			)
		);
		exit;
	}

	/**
	 * Handle the remove member form submission.
	 */
	public static function handle_remove_member() {
		check_admin_referer( self::REMOVE_MEMBER_NONCE_ACTION );

		$subscription_id = filter_input( INPUT_POST, 'subscription_id', FILTER_VALIDATE_INT ) ?? 0;
		$redirect_url    = wc_get_account_endpoint_url( self::MANAGE_MEMBERS_ENDPOINT . '/' . $subscription_id );

		$request = new \WP_REST_Request();
		$request->set_param( 'subscription_id', $subscription_id );
		if ( ! Group_Subscription_API::permission_callback( $request ) ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'activeTab' => 'members',
						'message'   => __( 'You do not have permission to remove members from this group subscription.', 'newspack-plugin' ),
						'is_error'  => true,
					],
					$redirect_url
				)
			);
			exit;
		}

		$member_id   = filter_input( INPUT_POST, 'member_id', FILTER_VALIDATE_INT ) ?? 0;
		$member_data = get_userdata( $member_id );
		$result      = Group_Subscription::update_members( $subscription_id, [], [ $member_id ] );

		if ( is_wp_error( $result ) ) {
			wp_safe_redirect(
				add_query_arg(
					[
						'activeTab' => 'members',
						'message'   => $result->get_error_message(),
						'is_error'  => true,
					],
					$redirect_url
				)
			);
			exit;
		}

		wp_safe_redirect(
			add_query_arg(
				[
					'activeTab'  => 'members',
					'message'    => sprintf(
						// translators: %s: The removed member's email address.
						__( '%s has been removed from this group subscription.', 'newspack-plugin' ),
						$member_data ? $member_data->user_email : $member_id
					),
					'is_success' => true,
				],
				$redirect_url
			)
		);
		exit;
	}
}
Group_Subscription_MyAccount::init();
