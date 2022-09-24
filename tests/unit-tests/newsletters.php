<?php
/**
 * Tests the Newsletters integration.
 *
 * @package Newspack\Tests
 */

use Newspack\Newspack_Newsletters;
use Newspack\Reader_Activation;

/**
 * Tests the Newsletters integration.
 */
class Newspack_Test_Newspack_Newsletters extends WP_UnitTestCase {
	/**
	 * Test the "master list" feature.
	 */
	public function test_newsletters_master_list_feature() {
		$list_ids = [ 1, 2, 3 ];
		self::assertEquals(
			$list_ids,
			Newspack_Newsletters::add_activecampaign_master_list( $list_ids, '', 'active_campaign' ),
			'Expected to get the same lists back when no master list is set.'
		);

		self::assertEquals(
			$list_ids,
			Newspack_Newsletters::add_activecampaign_master_list( $list_ids, '', 'other_provider' ),
			'Expected to get the same lists back when other provider is set.'
		);

		self::assertEquals(
			$list_ids,
			Newspack_Newsletters::get_lists_without_active_campaign_master_list( $list_ids ),
			'Expected to get the same lists back when no master list is set.'
		);

		// Set the master list.
		$master_list_id = 2;
		Reader_Activation::update_setting( 'active_campaign_master_list', $master_list_id );

		self::assertEquals(
			[ $master_list_id ],
			Newspack_Newsletters::add_activecampaign_master_list( [], '', 'active_campaign' ),
			'Expected to get the master list id if empty lists are passed.'
		);

		self::assertEquals(
			[ 4, 5, $master_list_id ],
			Newspack_Newsletters::add_activecampaign_master_list( [ 4, 5 ], '', 'active_campaign' ),
			'Master list id is appended.'
		);

		self::assertEquals(
			[ 1, 3 ],
			Newspack_Newsletters::get_lists_without_active_campaign_master_list( $list_ids ),
			'Expected to get the same lists back when no master list is set.'
		);
	}
}
