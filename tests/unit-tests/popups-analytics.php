<?php
/**
 * Tests the Campaigns (newspack-popups) Analytics functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Popups_Analytics_Utils;

/**
 * Tests the Campaigns (newspack-popups) Analytics functionality.
 */
class Newspack_Test_Popups_Analytics extends WP_UnitTestCase {
	/**
	 * Test legacy report generation.
	 */
	public function test_report_generation_legacy() {
		$ga_rows = [
			[
				'dimensions' => [
					'20210318',
					'Seen',
					'Newspack Announcement: Newsletter form (954)',
				],
				'metrics'    => [
					[
						'values' => [
							'4',
						],
					],
				],
			],
		];
		$report  = \Popups_Analytics_Utils::process_ga_report(
			$ga_rows,
			[
				'offset'         => '3',
				'event_label_id' => '',
				'event_action'   => '',
			]
		);
		self::assertEquals(
			$report,
			[
				'report'         =>
				[
					[
						'date'  => '2021-03-16',
						'value' => 0,
					],
					[
						'date'  => '2021-03-17',
						'value' => 0,
					],
					[
						'date'  => '2021-03-18',
						'value' => 4,
					],
				],
				'actions'        =>
				[
					[
						'label' => 'Seen',
						'value' => 'Seen',
					],
				],
				'labels'         =>
				[
					[
						'label' => 'Newsletter form',
						'value' => '954',
					],
				],
				'key_metrics'    =>
				[
					'seen'             => 4,
					'form_submissions' => -1,
					'link_clicks'      => -1,
				],
				'post_edit_link' => false,
			],
			'Report has expected shape.'
		);
	}

	/**
	 * Test report generation.
	 */
	public function test_report_generation() {
		$popup_title = 'Donations welcome';
		$event_code  = '1'; // 'Seen'.
		$popup_id    = wp_insert_post( [ 'post_title' => $popup_title ] );

		$ga_rows = [
			[
				'dimensions' => [
					'20210318',
					$popup_id . $event_code,
					'',
				],
				'metrics'    => [
					[
						'values' => [
							'4',
						],
					],
				],
			],
		];
		$report  = \Popups_Analytics_Utils::process_ga_report(
			$ga_rows,
			[
				'offset'         => '3',
				'event_label_id' => '',
				'event_action'   => '',
			]
		);
		self::assertEquals(
			$report,
			[
				'report'         =>
				[
					[
						'date'  => '2021-03-16',
						'value' => 0,
					],
					[
						'date'  => '2021-03-17',
						'value' => 0,
					],
					[
						'date'  => '2021-03-18',
						'value' => 4,
					],
				],
				'actions'        =>
				[
					[
						'label' => 'Seen',
						'value' => 'Seen',
					],
				],
				'labels'         =>
				[
					[
						'label' => $popup_title,
						'value' => $popup_id,
					],
				],
				'key_metrics'    =>
				[
					'seen'             => 4,
					'form_submissions' => -1,
					'link_clicks'      => -1,
				],
				'post_edit_link' => false,
			],
			'Report has expected shape.'
		);
	}
}
