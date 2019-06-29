<?php
/**
 * Tests the Google Ad Manager custom post type functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Wizards;

/**
 * Test ad slot creation and management.
 */
class Newspack_Test_Ad_Manager_Wizard extends WP_UnitTestCase {

	/**
	 * Set up wizard.
	 */
	public function setUp() {
		parent::setUp();
		$this->wizard = Wizards::get_wizard( 'google-ad-manager' );
	}

	/**
	 * Test adding a slot.
	 */
	public function test_add_slot() {
		$slot = [
			'name' => 'test',
			'code' => '<script>console.log("test");</script>',
		];

		$result = $this->wizard->add_ad_slot( $slot );
		$this->assertTrue( $result['id'] > 0 );
		$this->assertEquals( $slot['name'], $result['name'] );
		$this->assertEquals( $slot['code'], $result['code'] );

		$saved_slot = $this->wizard->get_ad_slot( $result['id'] );
		$this->assertEquals( $result, $saved_slot );
	}

	/**
	 * Test updating a slot.
	 */
	public function test_update_slot() {
		$slot = [
			'name' => 'test',
			'code' => '<script>console.log("test");</script>',
		];

		$result = $this->wizard->add_ad_slot( $slot );

		$update = $result;
		$update['name'] = 'new test';
		$update['code'] = '<script>console.log("updated");</script>';

		$update_result = $this->wizard->update_ad_slot( $update );
		$this->assertEquals( $update, $update_result );

		$saved_slot = $this->wizard->get_ad_slot( $update_result['id'] );
		$this->assertEquals( $update, $saved_slot );
	}

	/**
	 * Test deleting a slot.
	 */
	public function test_delete_slot() {
		$slot = [
			'name' => 'test',
			'code' => '<script>console.log("test");</script>',
		];

		$result = $this->wizard->add_ad_slot( $slot );

		$delete_result = $this->wizard->delete_ad_slot( $result['id'] );
		$this->assertTrue( $delete_result );

		$saved_slot = $this->wizard->get_ad_slot( $result['id'] );
		$this->assertTrue( is_wp_error( $saved_slot ) );
	}

	/**
	 * Test retrieving all slots.
	 */
	public function test_get_slots() {
		$slot1 = [
			'name' => 'test1',
			'code' => '<script>console.log("test1");</script>',
		];
		$slot2 = [
			'name' => 'test2',
			'code' => '<script>console.log("test2");</script>',
		];

		$this->wizard->add_ad_slot( $slot1 );
		$this->wizard->add_ad_slot( $slot2 );

		$slots = $this->wizard->get_ad_slots();
		$this->assertEquals( 2, count( $slots ) );
		foreach ( $slots as $slot ) {
			$this->assertTrue( $slot['id'] > 0 );
			$this->assertTrue( $slot['name'] === $slot1['name'] || $slot['name'] === $slot2['name'] );
			$this->assertTrue( $slot['code'] === $slot1['code'] || $slot['code'] === $slot2['code'] );
		}
	}
}
