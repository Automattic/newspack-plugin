<?php
/**
 * Tests the Webhooks functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Data_Events;

/**
 * Tests the Webhooks functionality.
 */
class Newspack_Test_Webhooks extends WP_UnitTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		// Delete all lingering endpoints and requests before starting tests.
		$endpoints = Data_Events\Webhooks::get_endpoints();
		foreach ( $endpoints as $endpoint ) {
			Data_Events\Webhooks::delete_endpoint( $endpoint['id'] );
		}
		$requests = get_posts(
			[
				'post_type'      => Data_Events\Webhooks::REQUEST_POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1,
			]
		);
		foreach ( $requests as $request ) {
			wp_delete_post( $request->ID, true );
		}
	}

	/**
	 * Dispatch a sample data event.
	 */
	private function dispatch_event() {
		$action_name = 'test_action';
		$data        = [ 'test' => 'data' ];
		Data_Events::register_action( $action_name );
		Data_Events::dispatch( $action_name, $data );
	}

	/**
	 * Test creating an endpoint.
	 */
	public function test_create_endpoint() {
		$url       = 'https://example.com/webhook';
		$actions   = [];
		$global    = true;
		$id        = Data_Events\Webhooks::create_endpoint( $url, $actions, $global );
		$endpoints = Data_Events\Webhooks::get_endpoints();
		$this->assertEquals( 1, count( $endpoints ) );
		$this->assertEquals( $id, $endpoints[0]['id'] );
		$this->assertEquals( $url, $endpoints[0]['url'] );
		$this->assertEquals( $actions, $endpoints[0]['actions'] );
		$this->assertEquals( $global, $endpoints[0]['global'] );
		$this->assertEquals( false, $endpoints[0]['disabled'] );
		return $id;
	}

	/**
	 * Test deleting an endpoint.
	 */
	public function test_delete_endpoint() {
		// Create an endpoint.
		$endpoint_id = $this->test_create_endpoint();

		// Delete the endpoint.
		Data_Events\Webhooks::delete_endpoint( $endpoint_id );

		// Assert that the endpoint was deleted.
		$endpoints = Data_Events\Webhooks::get_endpoints();
		$this->assertEquals( 0, count( $endpoints ) );
	}

	/**
	 * Test disabling an endpoint.
	 */
	public function test_disable_endpoint() {
		$endpoint_id = $this->test_create_endpoint();

		// Disable the endpoint.
		Data_Events\Webhooks::disable_endpoint( $endpoint_id );

		// Assert that the endpoint was disabled.
		$endpoints = Data_Events\Webhooks::get_endpoints();
		$this->assertEquals( 1, count( $endpoints ) );
		$this->assertEquals( true, $endpoints[0]['disabled'] );
	}

	/**
	 * Test that dispatching an action creates webhook requests.
	 */
	public function test_dispatch_create_request() {
		$endpoint_id = $this->test_create_endpoint();

		// Hook into webhook's handler to assert that the request was created.
		$requests = [];
		add_action(
			'newspack_webhooks_requests_created',
			function() use ( &$requests ) {
				$requests = func_get_args()[0];
			}
		);

		$this->dispatch_event();

		$this->assertEquals( 1, count( $requests ) );
	}

	/**
	 * Test that a disabled endpoint doesn't create webhook requests.
	 */
	public function test_disabled_endpoints() {
		// Create an endpoint.
		$endpoint_id = $this->test_create_endpoint();

		// Disable the endpoint.
		Data_Events\Webhooks::disable_endpoint( $endpoint_id );

		// Hook into webhook's handler to assert that the request was created.
		$requests = [];
		add_action(
			'newspack_webhooks_requests_created',
			function() use ( &$requests ) {
				$requests = func_get_args()[0];
			}
		);

		$this->dispatch_event();

		$this->assertEquals( 0, count( $requests ) );
	}

	/**
	 * Test request scheduling.
	 */
	public function test_request_scheduling() {
		// Create an endpoint.
		$endpoint_id = $this->test_create_endpoint();

		// Hook into webhook's handler to fetch the created request ID.
		$requests = [];
		add_action(
			'newspack_webhooks_requests_created',
			function() use ( &$requests ) {
				$requests = func_get_args()[0];
			}
		);

		$this->dispatch_event();

		$post = get_post( $requests[0] );
		$this->assertEquals( 'future', $post->post_status );
		$this->assertGreaterThan( time(), strtotime( $post->post_date ) );
	}

	/**
	 * Test that publishing a request processes it.
	 */
	public function test_request_publish() {
		// Create an endpoint.
		$endpoint_id = $this->test_create_endpoint();

		// Hook into webhook's handler to fetch the created request ID.
		$requests = [];
		add_action(
			'newspack_webhooks_requests_created',
			function() use ( &$requests ) {
				$requests = func_get_args()[0];
			}
		);

		$this->dispatch_event();

		$http_args = [];
		$http_url  = '';
		add_filter(
			'pre_http_request',
			function( $preempt, $args, $url ) use ( &$http_args, &$http_url ) {
				$http_args = $args;
				$http_url  = $url;
				return [
					'response' => [
						'code' => 200,
					],
				];
			},
			10,
			3
		);

		// Manually publish the request.
		wp_update_post(
			[
				'ID'            => $requests[0],
				'post_status'   => 'publish',
				'post_date'     => gmdate( 'Y-m-d H:i:s' ),
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s' ),
				'edit_date'     => true,
			]
		);

		$this->assertEquals( 'https://example.com/webhook', $http_url );
		$this->assertEquals( 'POST', $http_args['method'] );
		$this->assertEquals( 'application/json', $http_args['headers']['Content-Type'] );
		$this->assertEquals( get_post_meta( $requests[0], 'body', true ), $http_args['body'] );
	}

	/**
	 * Test that a failed send re-schedules the request.
	 */
	public function test_request_error_handling() {
		// Create an endpoint.
		$endpoint_id = $this->test_create_endpoint();

		// Hook into webhook's handler to fetch the created request ID.
		$requests = [];
		add_action(
			'newspack_webhooks_requests_created',
			function() use ( &$requests ) {
				$requests = func_get_args()[0];
			}
		);

		$this->dispatch_event();

		add_filter(
			'pre_http_request',
			function() {
				return [
					'response' => [
						'code' => 500,
					],
				];
			}
		);

		// Manually publish the request.
		wp_update_post(
			[
				'ID'            => $requests[0],
				'post_status'   => 'publish',
				'post_date'     => gmdate( 'Y-m-d H:i:s' ),
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s' ),
				'edit_date'     => true,
			]
		);

		$this->assertEquals( 'future', get_post_status( $requests[0] ) );
		$this->assertGreaterThan( time(), strtotime( get_post( $requests[0] )->post_date ) );
	}

	/**
	 * Test reaching max retries should kill the request and disable the endpoint.
	 */
	public function test_request_max_retries() {
		// Create an endpoint.
		$endpoint_id = $this->test_create_endpoint();

		// Hook into webhook's handler to fetch the created request ID.
		$requests = [];
		add_action(
			'newspack_webhooks_requests_created',
			function() use ( &$requests ) {
				$requests = func_get_args()[0];
			}
		);

		$this->dispatch_event();

		$max_retries = Data_Events\Webhooks::MAX_RETRIES;
		$retries     = 0;

		add_filter(
			'pre_http_request',
			function() {
				return [
					'response' => [
						'code' => 500,
					],
				];
			}
		);

		while ( $retries <= $max_retries ) {
			wp_update_post(
				[
					'ID'            => $requests[0],
					'post_status'   => 'publish',
					'post_date'     => gmdate( 'Y-m-d H:i:s' ),
					'post_date_gmt' => gmdate( 'Y-m-d H:i:s' ),
					'edit_date'     => true,
				]
			);
			$status = 'future';
			if ( $max_retries === $retries ) {
				$status = 'trash';
			}
			$this->assertEquals( $status, get_post_status( $requests[0] ) );
			$retries++;
		}

		$endpoints = Data_Events\Webhooks::get_endpoints();
		$this->assertTrue( $endpoints[0]['disabled'] );
	}

	/**
	 * Test that finished requests older than 7 days should be deleted.
	 */
	public function test_finished_request_deletion() {
		// Create an endpoint.
		$endpoint_id = $this->test_create_endpoint();

		add_filter(
			'pre_http_request',
			function() {
				return [
					'response' => [
						'code' => 200,
					],
				];
			}
		);

		for ( $i = 0; $i < 10; $i++ ) {
			$this->dispatch_event();
		}

		$requests = get_posts(
			[
				'post_type'      => Data_Events\Webhooks::REQUEST_POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1,
			]
		);

		$this->assertEquals( 10, count( $requests ) );

		// Manually publish each request and pretend half happened 10 days ago.
		foreach ( $requests as $i => $request ) {
			$date = gmdate( 'Y-m-d H:i:s', $i % 2 ? strtotime( '10 days ago' ) : time() );
			wp_update_post(
				[
					'ID'            => $request->ID,
					'post_status'   => 'publish',
					'post_date'     => $date,
					'post_date_gmt' => $date,
					'edit_date'     => true,
				]
			);
		}

		Data_Events\Webhooks::clear_finished();

		$requests = get_posts(
			[
				'post_type'      => Data_Events\Webhooks::REQUEST_POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1,
			]
		);

		// Half should've been deleted.
		$this->assertEquals( 5, count( $requests ) );
	}
}
