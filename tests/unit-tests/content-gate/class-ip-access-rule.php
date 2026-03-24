<?php
/**
 * Tests for IP_Access_Rule utility methods.
 *
 * @package Newspack\Tests\Content_Gate
 */

use Newspack\Content_Gate\IP_Access_Rule;

/**
 * Test IP_Access_Rule functionality.
 *
 * @group Access_Rules
 */
class Newspack_Test_IP_Access_Rule extends WP_UnitTestCase {

	/**
	 * Test exact IP matching.
	 */
	public function test_exact_ip_match() {
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '10.0.0.5', '10.0.0.5' ) );
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '10.0.0.6', '10.0.0.5' ) );
	}

	/**
	 * Test CIDR block matching.
	 */
	public function test_cidr_match() {
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '192.168.1.50', '192.168.1.0/24' ) );
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '192.168.2.1', '192.168.1.0/24' ) );
	}

	/**
	 * Test comma-separated ranges.
	 */
	public function test_comma_separated_ranges() {
		$ranges = '10.0.0.5,192.168.1.0/24';
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '10.0.0.5', $ranges ) );
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '192.168.1.100', $ranges ) );
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '172.16.0.1', $ranges ) );
	}

	/**
	 * Test that empty ranges string returns false.
	 */
	public function test_empty_ranges_returns_false() {
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '10.0.0.1', '' ) );
	}

	/**
	 * Test that an invalid CIDR entry is skipped and returns false.
	 */
	public function test_invalid_cidr_is_skipped() {
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '10.0.0.1', '999.999.999.999/24' ) );
	}

	/**
	 * Test that an invalid IP address returns false.
	 */
	public function test_invalid_ip_returns_false() {
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( 'not-an-ip', '10.0.0.0/8' ) );
	}

	/**
	 * Test that the REST route is registered.
	 */
	public function test_rest_route_registered() {
		do_action( 'rest_api_init' );

		$routes         = rest_get_server()->get_routes( NEWSPACK_API_NAMESPACE );
		$expected_route = '/' . NEWSPACK_API_NAMESPACE . IP_Access_Rule::REST_ROUTE;
		$this->assertArrayHasKey( $expected_route, $routes, 'The institutional access REST route should be registered.' );

		$endpoint = $routes[ $expected_route ][0];
		$this->assertArrayHasKey( 'GET', $endpoint['methods'], 'The route should accept GET requests.' );
	}

	/**
	 * Test the REST endpoint returns the expected JSON shape.
	 */
	public function test_rest_endpoint_response_shape() {
		$request  = new WP_REST_Request( 'GET', '/' . NEWSPACK_API_NAMESPACE . IP_Access_Rule::REST_ROUTE );
		$response = rest_do_request( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'valid', $data, 'Response should contain a "valid" key.' );
		$this->assertIsBool( $data['valid'] );
	}

	/**
	 * Test the REST endpoint returns institution name when IP matches.
	 */
	public function test_rest_endpoint_with_institution() {
		// Hook a filter that returns an institution post ID.
		$inst_id = self::factory()->post->create( [ 'post_title' => 'Test Library' ] );
		add_filter(
			'newspack_content_gate_check_ip',
			function () use ( $inst_id ) {
				return $inst_id;
			}
		);

		$request  = new WP_REST_Request( 'GET', '/' . NEWSPACK_API_NAMESPACE . IP_Access_Rule::REST_ROUTE );
		$response = @rest_do_request( $request ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- setcookie/nocache_headers cannot send headers in tests.
		$data = $response->get_data();

		$this->assertTrue( $data['valid'] );
		$this->assertSame( 'Test Library', $data['institution'] );

		remove_all_filters( 'newspack_content_gate_check_ip' );
		wp_delete_post( $inst_id, true );
	}

	/**
	 * Test get_redirect_url rebuilds the URL without the institutional-access param.
	 */
	public function test_redirect_url_strips_endpoint_param() {
		$original_uri           = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$original_get           = $_GET; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_SERVER['REQUEST_URI'] = '/some-article/?institutional-access=1&foo=bar';
		$_GET                   = [
			IP_Access_Rule::ENDPOINT => '1',
			'foo'                    => 'bar',
		];

		$method = new ReflectionMethod( IP_Access_Rule::class, 'get_redirect_url' );
		$method->setAccessible( true );
		$url = $method->invoke( null );

		$this->assertStringContainsString( '/some-article/', $url );
		$this->assertStringContainsString( 'foo=bar', $url );
		$this->assertStringNotContainsString( 'institutional-access', $url );

		if ( null === $original_uri ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $original_uri;
		}
		$_GET = $original_get;
	}

	/**
	 * Test get_dedicated_redirect_url uses redirect_to param.
	 */
	public function test_dedicated_redirect_url_uses_redirect_to() {
		$_GET = [ 'redirect_to' => home_url( '/target-page/' ) ];

		$method = new ReflectionMethod( IP_Access_Rule::class, 'get_dedicated_redirect_url' );
		$method->setAccessible( true );
		$url = $method->invoke( null );

		$this->assertSame( home_url( '/target-page/' ), $url );

		$_GET = [];
	}

	/**
	 * Test get_dedicated_redirect_url rejects external URLs.
	 */
	public function test_dedicated_redirect_url_rejects_external() {
		$_GET = [ 'redirect_to' => 'https://evil.com/steal' ];

		$method = new ReflectionMethod( IP_Access_Rule::class, 'get_dedicated_redirect_url' );
		$method->setAccessible( true );
		$url = $method->invoke( null );

		$this->assertSame( home_url( '/' ), $url );

		$_GET = [];
	}

	/**
	 * Test get_dedicated_redirect_url falls back to homepage.
	 */
	public function test_dedicated_redirect_url_fallback() {
		$_GET = [];

		$method = new ReflectionMethod( IP_Access_Rule::class, 'get_dedicated_redirect_url' );
		$method->setAccessible( true );
		$url = $method->invoke( null );

		$this->assertSame( home_url( '/' ), $url );
	}
}
