<?php
/**
 * Tests the plugins API functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\API\Plugins_Controller;

/**
 * Test plugin API endpoints functionality.
 */
class Newspack_Test_Plugins_Controller extends WP_UnitTestCase {

	/**
	 * Plugin slug/folder.
	 *
	 * @var string
	 */
	protected $api_namespace = '/newspack/v1';

	/**
	 * Set up stuff for testing API requests.
	 */
	public function setUp() {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		do_action( 'rest_api_init' );

		$this->administrator = $this->factory->user->create( [ 'role' => 'administrator' ] );
	}

	/**
	 * Test that the routes are all registered.
	 */
	public function test_register_route() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( $this->api_namespace . '/plugins', $routes );
	}

	/**
	 * Test retrieving the plugins as an unauthorized user.
	 */
	public function test_get_plugins_unauthorized() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', $this->api_namespace . '/plugins' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test retrieving the plugins as an authorized user.
	 */
	public function test_get_plugins_authorized() {
		wp_set_current_user( $this->administrator );
		$request  = new WP_REST_Request( 'GET', $this->api_namespace . '/plugins' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'jetpack', $data );

		$expected_jetpack_info = [
			'name'     => 'Jetpack',
			'wporg'    => true,
			'download' => 'jetpack',
			'status'   => 'uninstalled',
		];
		$this->assertEquals( $expected_jetpack_info, $data['jetpack'] );
	}
}
