<?php
/**
 * Tests for the Teams for Memberships integration.
 *
 * @package Newspack\Tests
 */

use Newspack\Teams_For_Memberships;

/**
 * Test Teams_For_Memberships helpers.
 *
 * @group teams-for-memberships
 */
class Test_Teams_For_Memberships extends WP_UnitTestCase {

	/**
	 * The filter must pass through unchanged when the action is not `create`.
	 */
	public function test_restore_team_meta_on_renewal_passes_through_non_create_actions() {
		$this->assertSame(
			'renew',
			Teams_For_Memberships::restore_team_meta_on_renewal( 'renew', null )
		);
		$this->assertSame(
			'seat_change',
			Teams_For_Memberships::restore_team_meta_on_renewal( 'seat_change', null )
		);
	}

	/**
	 * The filter must pass through unchanged when WC Subscriptions helpers are unavailable.
	 *
	 * This is the production safety path: on a site without WC Subscriptions (or without the
	 * SkyVerge Teams integration class), we must not short-circuit team creation.
	 */
	public function test_restore_team_meta_on_renewal_bails_without_subscriptions() {
		if ( function_exists( 'wcs_order_contains_renewal' ) ) {
			$this->markTestSkipped( 'WC Subscriptions is loaded; this test covers the fallback path only.' );
		}
		$this->assertSame(
			'create',
			Teams_For_Memberships::restore_team_meta_on_renewal( 'create', null )
		);
	}

	/**
	 * The filter must pass through unchanged when the item is not a product line item.
	 */
	public function test_restore_team_meta_on_renewal_ignores_non_product_items() {
		// stdClass is not a WC_Order_Item_Product, so the instanceof check should short-circuit.
		$this->assertSame(
			'create',
			Teams_For_Memberships::restore_team_meta_on_renewal( 'create', new stdClass() )
		);
	}

	/**
	 * The filter must be registered in init().
	 */
	public function test_filter_is_registered() {
		$this->assertNotFalse(
			has_filter(
				'wc_memberships_for_teams_determine_order_item_action',
				[ Teams_For_Memberships::class, 'restore_team_meta_on_renewal' ]
			),
			'The restore_team_meta_on_renewal filter should be registered during init().'
		);
	}
}
