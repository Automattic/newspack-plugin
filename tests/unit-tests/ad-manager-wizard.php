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
		$reflection = new ReflectionClass( 'Newspack\Google_Ad_Manager_Wizard' );

		$this->get_ad_units = $reflection->getMethod( '_get_ad_units' );
		$this->get_ad_units->setAccessible( true );

		$this->get_ad_unit = $reflection->getMethod( '_get_ad_unit' );
		$this->get_ad_unit->setAccessible( true );

		$this->add_ad_unit = $reflection->getMethod( '_add_ad_unit' );
		$this->add_ad_unit->setAccessible( true );

		$this->update_ad_unit = $reflection->getMethod( '_update_ad_unit' );
		$this->update_ad_unit->setAccessible( true );

		$this->delete_ad_unit = $reflection->getMethod( '_delete_ad_unit' );
		$this->delete_ad_unit->setAccessible( true );

		$this->extract_ad_width = $reflection->getMethod( '_extract_ad_width' );
		$this->extract_ad_width->setAccessible( true );

		$this->extract_ad_height = $reflection->getMethod( '_extract_ad_height' );
		$this->extract_ad_height->setAccessible( true );
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

		$update = $result;
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

	public function test_extract_ad_width() {
		$unit1_code = '<amp-ad width=300 height=250
    type="doubleclick"
    data-slot="/000000000000/test_ad">
</amp-ad>';
		$unit2_code = '<amp-ad width=468 height=60
    type="doubleclick"
    data-slot="/00000000000/test_ad"
    data-multi-size="320x50">
</amp-ad>';

		$unit1_width = $this->extract_ad_width->invokeArgs( $this->wizard, [ $unit1_code ] );
		$unit2_width = $this->extract_ad_width->invokeArgs( $this->wizard, [ $unit2_code ] );

		$this->assertEquals( 300, $unit1_width );
		$this->assertEquals( 468, $unit2_width );
	}

	public function test_extract_ad_height() {
		$unit1_code = '<amp-ad width=300 height=250
    type="doubleclick"
    data-slot="/000000000000/test_ad">
</amp-ad>';
		$unit2_code = '<amp-ad width=468 height=60
    type="doubleclick"
    data-slot="/00000000000/test_ad"
    data-multi-size="320x50">
</amp-ad>';

		$unit1_height = $this->extract_ad_height->invokeArgs( $this->wizard, [ $unit1_code ] );
		$unit2_height = $this->extract_ad_height->invokeArgs( $this->wizard, [ $unit2_code ] );

		$this->assertEquals( 250, $unit1_height );
		$this->assertEquals( 60, $unit2_height );
	}
}
