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
	 * Group page endpoint slug.
	 */
	const GROUP_ENDPOINT = 'group';

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
	 * Nonce action for the leave-group (self-removal) form.
	 */
	const LEAVE_GROUP_NONCE_ACTION = 'newspack_group_subscription_leave_group';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		// Ensure My Account UI v1 is active before registering endpoints/actions.
		if ( ! class_exists( 'Newspack\\My_Account_UI_V1' ) ) {
			return;
		}
		add_action( 'init', [ __CLASS__, 'flush_rewrite_rules' ] );
		add_filter( 'woocommerce_get_query_vars', [ __CLASS__, 'add_manage_members_endpoint' ] );
		add_filter( 'woocommerce_get_query_vars', [ __CLASS__, 'add_group_endpoint' ] );
		add_action( 'woocommerce_account_' . self::GROUP_ENDPOINT . '_endpoint', [ __CLASS__, 'resolve_group_landing' ] );
		// Keep the legacy endpoint addressable; redirect to the new one.
		add_action( 'woocommerce_account_' . self::MANAGE_MEMBERS_ENDPOINT . '_endpoint', [ __CLASS__, 'render_manage_members_template_redirect' ] );
		add_filter( 'wcs_get_users_subscriptions', [ __CLASS__, 'inject_member_group_subscriptions' ], 15, 2 );
		add_filter( 'map_meta_cap', [ __CLASS__, 'grant_group_member_view_order_cap' ], 15, 4 );
		add_filter( 'wcs_view_subscription_actions', [ __CLASS__, 'view_subscription_actions' ], 13, 3 );
		add_action( 'admin_post_' . self::INVITE_NONCE_ACTION, [ __CLASS__, 'handle_invite_member' ] );
		add_action( 'admin_post_' . self::CANCEL_INVITE_NONCE_ACTION, [ __CLASS__, 'handle_cancel_invite' ] );
		add_action( 'admin_post_' . self::REMOVE_MEMBER_NONCE_ACTION, [ __CLASS__, 'handle_remove_member' ] );
		add_action( 'admin_post_' . self::LEAVE_GROUP_NONCE_ACTION, [ __CLASS__, 'handle_leave_group' ] );
	}

	/**
	 * Flush rewrite rules for My Account endpoints for group subscriptions.
	 */
	public static function flush_rewrite_rules() {
		$rewrite_rules_updated_option_name = 'newspack_group_subscription_rewrite_rules_updated_v2';
		if ( false === get_option( $rewrite_rules_updated_option_name ) ) {
			flush_rewrite_rules(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules
			update_option( $rewrite_rules_updated_option_name, true );
		}
	}

	/**
	 * Build a URL to a specific group's page.
	 *
	 * @param \WC_Subscription|int $subscription Subscription or subscription ID.
	 *
	 * @return string The URL.
	 */
	public static function get_group_url( $subscription ) {
		$subscription_id = $subscription instanceof \WC_Subscription
			? $subscription->get_id()
			: absint( $subscription );
		return wc_get_endpoint_url(
			self::GROUP_ENDPOINT,
			$subscription_id,
			wc_get_page_permalink( 'myaccount' )
		);
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
	 * Add group query var.
	 *
	 * @param array $query_vars Query vars.
	 *
	 * @return array
	 */
	public static function add_group_endpoint( $query_vars ) {
		$query_vars[ self::GROUP_ENDPOINT ] = self::GROUP_ENDPOINT;
		return $query_vars;
	}

	/**
	 * Handle the new `group` endpoint.
	 *
	 * @param mixed $value Subscription ID passed as the endpoint value, if any.
	 */
	public static function resolve_group_landing( $value ) {
		$user_id         = \get_current_user_id();
		$subscription_id = absint( $value );

		if ( $subscription_id ) {
			$subscription = WooCommerce_Subscriptions::sanitize_subscription( $subscription_id );
			if ( ! $subscription || ! Group_Subscription::user_is_manager( $user_id, $subscription ) ) {
				wp_safe_redirect(
					add_query_arg(
						[
							'message'  => __( 'You do not have permission to manage this group.', 'newspack-plugin' ),
							'is_error' => true,
						],
						wc_get_account_endpoint_url( 'dashboard' )
					)
				);
				exit;
			}
			self::render_group_page( $subscription );
			return;
		}

		$managed = Group_Subscription::get_managed_subscriptions_for_user( $user_id );
		if ( 0 === count( $managed ) ) {
			wp_safe_redirect( wc_get_account_endpoint_url( 'dashboard' ) );
			exit;
		}
		if ( 1 === count( $managed ) ) {
			wp_safe_redirect( self::get_group_url( $managed[0] ) );
			exit;
		}
		self::render_group_picker( $managed );
	}

	/**
	 * Render the group page shell.
	 *
	 * @param \WC_Subscription $subscription Subscription.
	 */
	public static function render_group_page( $subscription ) {
		$args = [
			'subscription' => $subscription,
			'actions'      => \wcs_get_all_user_actions_for_subscription( $subscription, \get_current_user_id() ),
		];
		\wc_get_template( 'myaccount/group.php', $args );
	}

	/**
	 * Render the multi-group picker.
	 *
	 * @param \WC_Subscription[] $managed Managed group subscriptions.
	 */
	public static function render_group_picker( $managed ) {
		\wc_get_template( 'myaccount/group-picker.php', [ 'managed' => $managed ] );
	}

	/**
	 * Redirect the legacy manage-members endpoint to the new group endpoint.
	 *
	 * @param mixed $value Subscription ID passed as the endpoint value.
	 */
	public static function render_manage_members_template_redirect( $value ) {
		$subscription_id = absint( $value );
		if ( ! $subscription_id ) {
			wp_safe_redirect( wc_get_endpoint_url( self::GROUP_ENDPOINT, '', wc_get_page_permalink( 'myaccount' ) ) );
			exit;
		}
		wp_safe_redirect(
			wc_get_endpoint_url(
				self::GROUP_ENDPOINT,
				$subscription_id,
				wc_get_page_permalink( 'myaccount' )
			),
			308
		);
		exit;
	}

	/**
	 * Filter the actions a group manager or member can take on a subscription.
	 *
	 * Non-manager group members receive an empty actions array (view-only experience).
	 * Non-group subscriptions and off-account-page requests pass through unchanged.
	 *
	 * @param array            $actions      Actions.
	 * @param \WC_Subscription $subscription Subscription.
	 * @param int              $user_id      The user ID.
	 *
	 * @return array
	 */
	public static function view_subscription_actions( $actions, $subscription, $user_id ) {
		if ( ! function_exists( 'is_account_page' ) || ! \is_account_page() || ! Group_Subscription::is_group_subscription( $subscription ) ) {
			return $actions;
		}

		// Non-manager group members get a view-only experience: no actions.
		if ( Group_Subscription::user_is_member( $user_id, $subscription ) ) {
			return [];
		}

		// Managers reach Members via the new Group sidebar entry / tab — no action button needed.
		return $actions;
	}

	/**
	 * Get subscription ID and redirect URL from POST data.
	 *
	 * @return array{ 0: int, 1: string }
	 */
	private static function get_subscription_context(): array {
		$subscription_id = filter_input( INPUT_POST, 'subscription_id', FILTER_VALIDATE_INT ) ?? 0;
		$redirect_url    = self::get_group_url( $subscription_id );
		return [ $subscription_id, $redirect_url ];
	}

	/**
	 * Whether the subscription is in a state that accepts manager-driven changes
	 * (invite, cancel-invite, remove-member). Terminal statuses block all writes
	 * — there's no point inviting someone to a sub that no longer grants access.
	 *
	 * @param int|\WC_Subscription $subscription Subscription or ID.
	 *
	 * @return bool
	 */
	public static function is_subscription_manageable( $subscription ): bool {
		$subscription = WooCommerce_Subscriptions::sanitize_subscription( $subscription );
		if ( ! $subscription instanceof \WC_Subscription ) {
			return false;
		}
		return ! $subscription->has_status( [ 'cancelled', 'expired', 'trash' ] );
	}

	/**
	 * Verify the subscription accepts manager changes, redirecting with an error on failure.
	 *
	 * @param int    $subscription_id Subscription ID.
	 * @param string $redirect_url    URL to redirect to on failure.
	 * @param string $active_tab      Active tab slug for the redirect.
	 */
	private static function verify_manageable( $subscription_id, $redirect_url, $active_tab ): void {
		if ( self::is_subscription_manageable( $subscription_id ) ) {
			return;
		}
		$error_message = __( 'This group subscription is no longer active, so its members can\'t be changed.', 'newspack-plugin' );
		self::redirect(
			new \WP_Error( 'newspack_group_subscription_inactive', $error_message ),
			$redirect_url,
			$active_tab,
			$error_message
		);
	}

	/**
	 * Verify the current user has permission to manage the subscription, redirecting on failure.
	 *
	 * @param int         $subscription_id Subscription ID.
	 * @param string      $redirect_url    URL to redirect to on failure.
	 * @param string      $active_tab      Active tab slug for the redirect.
	 * @param string|null $error_message   Error message to display.
	 */
	private static function verify_permission( $subscription_id, $redirect_url, $active_tab, $error_message = null ): void {
		if ( ! $error_message ) {
			$error_message = __( 'You do not have permission to manage members for this group subscription.', 'newspack-plugin' );
		}
		$request = new \WP_REST_Request();
		$request->set_param( 'subscription_id', $subscription_id );
		if ( ! Group_Subscription_API::permission_callback( $request ) ) {
			self::redirect(
				new \WP_Error( 'newspack_group_subscription_permission_denied', $error_message ),
				$redirect_url,
				$active_tab,
				$error_message
			);
		}
	}

	/**
	 * Redirect with a success or error message depending on the action result.
	 *
	 * @param \WP_Error|mixed $result          Result of the action.
	 * @param string          $redirect_url    URL to redirect to.
	 * @param string          $active_tab      Active tab slug for the redirect.
	 * @param string          $success_message Success message to display.
	 */
	private static function redirect( $result, $redirect_url, $active_tab, $success_message ): never {
		$query_args = [
			'activeTab' => $active_tab,
			'message'   => $success_message,
		];
		if ( is_wp_error( $result ) ) {
			$query_args['is_error'] = true;
			$query_args['message'] = $result->get_error_message();
		} else {
			$query_args['is_success'] = true;
		}
		wp_safe_redirect(
			add_query_arg( $query_args, $redirect_url )
		);
		exit;
	}

	/**
	 * Handle the invite member form submission.
	 */
	public static function handle_invite_member() {
		check_admin_referer( self::INVITE_NONCE_ACTION );
		[ $subscription_id, $redirect_url ] = self::get_subscription_context();
		self::verify_permission( $subscription_id, $redirect_url, 'invites' );
		self::verify_manageable( $subscription_id, $redirect_url, 'invites' );

		$email  = filter_input( INPUT_POST, 'newspack-group-subscription-invite-email', FILTER_SANITIZE_EMAIL ) ?? '';
		$invite = Group_Subscription_Invite::generate_invite( $subscription_id, $email );

		self::redirect(
			$invite,
			$redirect_url,
			'invites',
			sprintf(
				// translators: %s: The invited email address.
				__( '%s has been invited to become a member of this group subscription.', 'newspack-plugin' ),
				$email
			)
		);
	}

	/**
	 * Handle the cancel invite form submission.
	 */
	public static function handle_cancel_invite() {
		check_admin_referer( self::CANCEL_INVITE_NONCE_ACTION );
		[ $subscription_id, $redirect_url ] = self::get_subscription_context();
		self::verify_permission( $subscription_id, $redirect_url, 'invites' );
		self::verify_manageable( $subscription_id, $redirect_url, 'invites' );

		$email  = filter_input( INPUT_POST, 'email', FILTER_SANITIZE_EMAIL ) ?? '';
		$result = Group_Subscription_Invite::cancel_invite( $subscription_id, $email );

		self::redirect(
			$result,
			$redirect_url,
			'invites',
			sprintf(
				// translators: %s: The cancelled invitation's email address.
				__( 'The invitation for %s has been cancelled.', 'newspack-plugin' ),
				$email
			)
		);
	}

	/**
	 * Inject group subscriptions the current user is a member of into the subscriptions list.
	 *
	 * Only runs on My Account pages to avoid side effects (e.g. trial limit checks)
	 * in non-account contexts.
	 *
	 * @param array $subscriptions Existing subscriptions keyed by subscription ID.
	 * @param int   $user_id       The user ID.
	 *
	 * @return array
	 */
	public static function inject_member_group_subscriptions( $subscriptions, $user_id ) {
		if ( ! function_exists( 'is_account_page' ) || ! \is_account_page() ) {
			return $subscriptions;
		}
		// Don't add Group Subscription features to My Account when Woo Memberships
		// is active. TODO: Remove this once Access Control is fully released.
		// Mirrors the suppression that used to live in Group_Subscription::is_group_subscription(),
		// preserved here at the UI layer now that data-layer callers always see the canonical state.
		if ( Memberships::is_active() ) {
			return $subscriptions;
		}
		$existing_ids        = array_keys( $subscriptions );
		$group_subscriptions = Group_Subscription::get_group_subscriptions_for_user( $user_id );
		foreach ( $group_subscriptions as $group_subscription ) {
			if ( ! ( $group_subscription instanceof \WC_Subscription ) ) {
				continue;
			}
			if ( $group_subscription->has_status( 'trash' ) ) {
				continue;
			}
			if ( in_array( $group_subscription->get_id(), $existing_ids, true ) ) {
				continue;
			}
			$subscriptions[ $group_subscription->get_id() ] = $group_subscription;
		}
		return $subscriptions;
	}

	/**
	 * Grant the `view_order` capability to group subscription members on My Account pages.
	 *
	 * WCS checks current_user_can( 'view_order', $subscription->get_id() ) before rendering
	 * the view-subscription template. WC maps view_order → manage_woocommerce for non-owners.
	 * We override this to 'read' (a primitive cap all logged-in users have) for group members.
	 *
	 * @param string[] $caps    Primitive capabilities required.
	 * @param string   $cap     The meta capability being checked.
	 * @param int      $user_id The user ID.
	 * @param array    $args    Additional arguments; $args[0] is the post/order ID.
	 *
	 * @return string[]
	 */
	public static function grant_group_member_view_order_cap( $caps, $cap, $user_id, $args ) {
		if ( 'view_order' !== $cap || ! function_exists( 'is_account_page' ) || ! \is_account_page() ) {
			return $caps;
		}
		$order_id     = isset( $args[0] ) ? absint( $args[0] ) : 0;
		$subscription = WooCommerce_Subscriptions::sanitize_subscription( $order_id );
		if ( ! $subscription || $subscription->has_status( 'trash' ) ) {
			return $caps;
		}
		if ( Group_Subscription::user_is_member( $user_id, $subscription ) ) {
			return [ 'read' ];
		}
		return $caps;
	}

	/**
	 * Handle the leave-group form submission (a member removing themselves).
	 *
	 * Unlike manager-driven mutations, this is allowed even on cancelled
	 * subscriptions — a member should always be able to walk away.
	 */
	public static function handle_leave_group() {
		check_admin_referer( self::LEAVE_GROUP_NONCE_ACTION );
		$subscription_id = isset( $_POST['subscription_id'] ) ? absint( wp_unslash( $_POST['subscription_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$user_id         = get_current_user_id();
		$dashboard_url   = function_exists( 'wc_get_account_endpoint_url' )
			? wc_get_account_endpoint_url( 'dashboard' )
			: home_url();

		if ( ! $user_id || ! Group_Subscription::user_is_member( $user_id, $subscription_id ) ) {
			self::redirect(
				new \WP_Error( 'newspack_group_subscription_not_a_member', __( 'You are not a member of this group subscription.', 'newspack-plugin' ) ),
				$dashboard_url,
				'',
				__( 'You are not a member of this group subscription.', 'newspack-plugin' )
			);
		}

		$result = Group_Subscription::update_members( $subscription_id, [], [ $user_id ] );

		self::redirect(
			$result,
			$dashboard_url,
			'',
			__( 'You have left the group subscription.', 'newspack-plugin' )
		);
	}

	/**
	 * Handle the remove member form submission.
	 */
	public static function handle_remove_member() {
		check_admin_referer( self::REMOVE_MEMBER_NONCE_ACTION );
		[ $subscription_id, $redirect_url ] = self::get_subscription_context();
		self::verify_permission( $subscription_id, $redirect_url, 'members' );
		self::verify_manageable( $subscription_id, $redirect_url, 'members' );

		$member_id = filter_input( INPUT_POST, 'member_id', FILTER_VALIDATE_INT ) ?? 0;
		$result    = Group_Subscription::update_members( $subscription_id, [], [ $member_id ] );

		$member_label = newspack_get_user_display_label( $member_id );
		if ( '' === $member_label ) {
			$member_label = (string) $member_id;
		}

		self::redirect(
			$result,
			$redirect_url,
			'members',
			sprintf(
				/* translators: 1: removed member's name or email, 2: lowercase singular group label. */
				__( '%1$s has been removed from this %2$s.', 'newspack-plugin' ),
				$member_label,
				mb_strtolower( Group_Subscription::get_label( 'singular' ) )
			)
		);
	}
}
Group_Subscription_MyAccount::init();
