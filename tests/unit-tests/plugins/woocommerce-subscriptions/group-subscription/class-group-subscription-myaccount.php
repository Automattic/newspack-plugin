<?php
/**
 * Tests for Group_Subscription_MyAccount My Account integration.
 *
 * @package Newspack\Tests
 * @group group-subscription-myaccount
 */

namespace Newspack\Tests;

use Newspack\Group_Subscription;
use Newspack\Group_Subscription_MyAccount;
use Newspack\Group_Subscription_Settings;

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- Test file intentionally mixes stub functions with test class.

// Stub is_account_page() so we can control it in tests.
// The real function is provided by WooCommerce and absent in the test environment.
if ( ! function_exists( 'is_account_page' ) ) {
	/**
	 * Stub for WooCommerce is_account_page().
	 *
	 * @return bool
	 */
	function is_account_page() {
		return $GLOBALS['newspack_test_is_account_page'] ?? false;
	}
}

// Stub wc_get_endpoint_url() used by get_manage_members_url().
if ( ! function_exists( 'wc_get_endpoint_url' ) ) {
	/**
	 * Stub for WooCommerce wc_get_endpoint_url().
	 *
	 * @param string $endpoint  The endpoint slug.
	 * @param string $value     Optional endpoint value.
	 * @param string $permalink Optional base permalink.
	 * @return string
	 */
	function wc_get_endpoint_url( $endpoint, $value = '', $permalink = '' ) {
		return $permalink . $endpoint . '/' . $value;
	}
}

// Stub wc_get_page_permalink() used by get_manage_members_url().
if ( ! function_exists( 'wc_get_page_permalink' ) ) {
	/**
	 * Stub for WooCommerce wc_get_page_permalink().
	 *
	 * @param string $page The page slug.
	 * @return string
	 */
	function wc_get_page_permalink( $page ) {
		return 'https://example.com/my-account/';
	}
}

/**
 * Test Group_Subscription_MyAccount My Account integration.
 */
class Test_Group_Subscription_MyAccount extends \WP_UnitTestCase {

	/**
	 * User IDs tracked for teardown.
	 *
	 * @var int[]
	 */
	protected $user_ids = [];

	/**
	 * Set up: simulate being on the account page.
	 */
	public function set_up() {
		parent::set_up();
		$GLOBALS['newspack_test_is_account_page'] = true;
	}

	/**
	 * Tear down: reset globals and subscriptions DB.
	 */
	public function tear_down() {
		global $subscriptions_database;
		$subscriptions_database = [];

		unset( $GLOBALS['newspack_test_is_account_page'] );

		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = [];

		wp_set_current_user( 0 );
		parent::tear_down();
	}

	// ---- Helpers ----

	/**
	 * Create a reader user.
	 *
	 * @param string $email Optional email address.
	 * @return int User ID.
	 */
	private function create_reader_user( string $email = '' ): int {
		if ( ! $email ) {
			$email = 'reader-' . wp_generate_password( 6, false ) . '@test.com';
		}
		$user_id = wp_insert_user(
			[
				'user_login' => 'reader-' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => $email,
				'role'       => 'subscriber',
			]
		);
		update_user_meta( $user_id, '_newspack_reader', true );
		$this->user_ids[] = $user_id;
		return $user_id;
	}

	/**
	 * Create a group subscription owned by $customer_id.
	 *
	 * @param int $customer_id The customer/owner user ID.
	 * @return \WC_Subscription
	 */
	private function create_group_subscription( int $customer_id ): \WC_Subscription {
		$sub = wcs_create_subscription(
			[
				'customer_id'    => $customer_id,
				'status'         => 'active',
				'billing_period' => 'month',
			]
		);
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		return $sub;
	}

	/**
	 * Create a regular (non-group) subscription owned by $customer_id.
	 *
	 * @param int $customer_id The customer/owner user ID.
	 * @return \WC_Subscription
	 */
	private function create_regular_subscription( int $customer_id ): \WC_Subscription {
		return wcs_create_subscription(
			[
				'customer_id'    => $customer_id,
				'status'         => 'active',
				'billing_period' => 'month',
			]
		);
	}

	/**
	 * Add $member_id as a member of $subscription.
	 *
	 * @param int              $member_id    The user ID to add as a member.
	 * @param \WC_Subscription $subscription The group subscription.
	 */
	private function add_member( int $member_id, \WC_Subscription $subscription ): void {
		add_user_meta( $member_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $subscription->get_id() );
	}
}
