<?php

namespace Newspack;

class GA_4 {

	public static function init() {

		add_action( 'wp_ajax_ga4_trigger_event', array( __CLASS__, 'ajax_callback' ) );
		add_action( 'wp_ajax_nopriv_ga4_trigger_event', array( __CLASS__, 'ajax_callback' ) );

		Data_Events::register_handler( [ __CLASS__, 'handle_click_body' ], 'click_body' );
		Data_Events::register_handler( [ __CLASS__, 'handle_reader_registered' ], 'reader_registered' );
	}

	public static function ajax_callback() {

		check_ajax_referer( 'newspack_ga4_poc_nonce' );

		Logger::log(
			'Handling ajax request',
			'GA4 POC'
		);

		Data_Events::dispatch( $_POST['params']['event_name'], $_POST['params']['event_params'], true );
		die;
	}

	public static function send_event( $name, $params, $user_id = null ) {

		// Go to Analytics > Admin > Data Streams and you will find these values .
		$api_secret     = get_option( 'ga4_poc_api_secret' );
		$measurement_id = get_option( 'ga4_poc_measurement_id' );

		$client_id = self::extract_cid_from_cookies();

		$payload = [
			'client_id' => $client_id,
			'events'    => [
				[
					'name'   => $name,
					'params' => $params,
				],
			],
		];

		if ( $user_id ) {
			$payload['user_id'] = $user_id;
		}

		Logger::log(
			sprintf( 'Sending event with client "%s" and user "%s".', $client_id, $user_id ),
			'GA4 POC'
		);

		$url = add_query_arg(
			[
				'api_secret'     => $api_secret,
				'measurement_id' => $measurement_id,
			],
			'https://www.google-analytics.com/mp/collect'
		);

		$r = wp_remote_post(
			$url,
			[
				'body' => wp_json_encode( $payload ),
			]
		);

		Logger::log(
			'Event sent.',
			'GA4 POC'
		);

	}

	public static function extract_cid_from_cookies() {

		if ( isset( $_COOKIE['_ga'] ) ) {
			$cookie_pieces = explode( '.', $_COOKIE['_ga'], 3 ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			if ( 1 === count( $cookie_pieces ) ) {
				$cid = reset( $cookie_pieces );
			} else {
				list( $version, $domain_depth, $cid ) = $cookie_pieces;
			}
		} else {
			$time = time();
			// make up a _ga cookie using variables based on what we know about the _ga cookie, advice taken from multiple sources including - http://taylrr.co.uk/blog/server-side-analytics/
			// will need to check against the js cookies now and then to ensure compatability
			$cid                 = rand( 1000000000, 2147483647 ) . ".{$time}";
			$numDomainComponents = count( explode( '.', preg_replace( '/^www\./', '', $_SERVER['HTTP_HOST'] ) ) );
			$ga                  = "GA1.{$numDomainComponents}.{$cid}";
			setcookie( '_ga', $ga, $time + 63115200, '/', $_SERVER['HTTP_HOST'], false, false );
			$_COOKIE['_ga'] = $ga;
		}

		return $cid;
	}

	public static function handle_click_body( $timestamp, $data, $user_id ) {

		self::send_event( 'click_body', $data, $user_id );

	}

	public static function handle_reader_registered( $timestamp, $data, $user_id ) {

		$event_name = 'reader_registered';
		$event_data = [
			'status'              => 'success',
			'method'              => $data['metadata']['registration_method'],
			'include_newsletters' => ! empty( $data['metadata']['lists'] ),
		];
		self::send_event( $event_name, $event_data, $user_id );
	}
}

GA_4::init();
