<?php
/**
 * Tests the Google Ad Manager custom post type functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Wizards, Newspack\Google_Ad_Manager_Wizard;

/**
 * Test ad unit creation and management.
 */
class Newspack_Test_Ad_Manager_Wizard extends WP_UnitTestCase {

	/**
	 * Set up wizard.
	 */
	public function setUp() {
		parent::setUp();
		$this->wizard = Wizards::get_wizard( 'google-ad-manager' );
		$reflection   = new ReflectionClass( 'Newspack\Google_Ad_Manager_Wizard' );

		$this->get_ad_units = $reflection->getMethod( 'get_ad_units' );
		$this->get_ad_units->setAccessible( true );

		$this->get_ad_unit = $reflection->getMethod( 'get_ad_unit' );
		$this->get_ad_unit->setAccessible( true );

		$this->add_ad_unit = $reflection->getMethod( 'add_ad_unit' );
		$this->add_ad_unit->setAccessible( true );

		$this->update_ad_unit = $reflection->getMethod( 'update_ad_unit' );
		$this->update_ad_unit->setAccessible( true );

		$this->delete_ad_unit = $reflection->getMethod( 'delete_ad_unit' );
		$this->delete_ad_unit->setAccessible( true );
	}

	/**
	 * Test adding a unit.
	 */
	public function test_add_unit() {
		$unit = [
			'name' => 'test',
			'code' => '<script>console.log("test");</script>',
		];

		$result = $this->add_ad_unit->invokeArgs( $this->wizard, [ $unit ] );
		$this->assertTrue( $result['id'] > 0 );
		$this->assertEquals( $unit['name'], $result['name'] );
		$this->assertEquals( $unit['code'], $result['code'] );

		$saved_unit = $this->get_ad_unit->invokeArgs( $this->wizard, [ $result['id'] ] );
		$this->assertEquals( $result, $saved_unit );
	}

	/**
	 * Test updating a unit.
	 */
	public function test_update_unit() {
		$unit = [
			'name' => 'test',
			'code' => '<script>console.log("test");</script>',
		];

		$result = $this->add_ad_unit->invokeArgs( $this->wizard, [ $unit ] );

		$update         = $result;
		$update['name'] = 'new test';
		$update['code'] = '<script>console.log("updated");</script>';

		$update_result = $this->update_ad_unit->invokeArgs( $this->wizard, [ $update ] );
		$this->assertEquals( $update, $update_result );

		$saved_unit = $this->get_ad_unit->invokeArgs( $this->wizard, [ $update_result['id'] ] );
		$this->assertEquals( $update, $saved_unit );
	}

	/**
	 * Test deleting a unit.
	 */
	public function test_delete_unit() {
		$unit = [
			'name' => 'test',
			'code' => '<script>console.log("test");</script>',
		];

		$result = $this->add_ad_unit->invokeArgs( $this->wizard, [ $unit ] );

		$delete_result = $this->delete_ad_unit->invokeArgs( $this->wizard, [ $result['id'] ] );
		$this->assertTrue( $delete_result );

		$saved_unit = $this->get_ad_unit->invokeArgs( $this->wizard, [ $result['id'] ] );
		$this->assertTrue( is_wp_error( $saved_unit ) );
	}

	/**
	 * Test retrieving all units.
	 */
	public function test_get_units() {
		$unit1 = [
			'name' => 'test1',
			'code' => '<script>console.log("test1");</script>',
		];
		$unit2 = [
			'name' => 'test2',
			'code' => '<script>console.log("test2");</script>',
		];

		$this->add_ad_unit->invokeArgs( $this->wizard, [ $unit1 ] );
		$this->add_ad_unit->invokeArgs( $this->wizard, [ $unit2 ] );

		$units = $this->get_ad_units->invokeArgs( $this->wizard, [] );
		$this->assertEquals( 2, count( $units ) );
		foreach ( $units as $unit ) {
			$this->assertTrue( $unit['id'] > 0 );
			$this->assertTrue( $unit['name'] === $unit1['name'] || $unit['name'] === $unit2['name'] );
			$this->assertTrue( $unit['code'] === $unit1['code'] || $unit['code'] === $unit2['code'] );
		}
	}
}
