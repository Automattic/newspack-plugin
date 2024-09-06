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

	/**
	 * Contact handling.
	 */
	public static function test_newsletters_contact_handling() {
		$utm_params = [
			'campaign' => 'test_campaign',
			'content'  => 'test_content',
		];
		$contact = [
			'email'    => 'test@email.com',
			'name'     => 'John Doe',
			'metadata' => [
				'NP_Payment Page'                    => '/donate/?utm_campaign=' . $utm_params['campaign'] . '&utm_content=' . $utm_params['content'],
				'NP_Payment UTM: campaign'           => $utm_params['campaign'],
				'NP_Membership Status'               => 'Donor',
				'NP_Product Name'                    => 'Donate: One-Time',
				'NP_Last Payment Amount'             => '20.00',
				'NP_Last Payment Date'               => '2024-08-27',
				'NP_Payment UTM: source'             => '',
				'NP_Payment UTM: medium'             => '',
				'NP_Payment UTM: term'               => '',
				'NP_Payment UTM: content'            => $utm_params['content'],
				'NP_Current Subscription Start Date' => '',
				'NP_Current Subscription End Date'   => '',
				'NP_Billing Cycle'                   => '',
				'NP_Recurring Payment'               => '',
				'NP_Next Payment Date'               => '',
				'NP_Total Paid'                      => '109.00',
				'NP_Account'                         => '492',
				'NP_Registration Date'               => '2024-08-26',
			],
		];
		$normalized_contact = Newspack_Newsletters::normalize_contact_data( $contact );
		self::assertEquals( $contact['email'], $normalized_contact['email'] );
		self::assertEquals( $utm_params['campaign'], $normalized_contact['metadata']['NP_Payment UTM: campaign'] );
		self::assertEquals( $utm_params['content'], $normalized_contact['metadata']['NP_Payment UTM: content'] );
		self::assertEquals( '', $normalized_contact['metadata']['NP_Payment UTM: term'] );
	}
}
