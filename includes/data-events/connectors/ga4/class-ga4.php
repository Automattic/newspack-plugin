<?php
/**
 * Newspack Data Events Ga4 Connector
 *
 * @package Newspack
 */

namespace Newspack\Data_Events\Connectors;

require_once 'class-event.php';

use Automattic\Jetpack\Device_Detection;
use Newspack\Data_Events;
use Newspack\Data_Events\Connectors\GA4\Event;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Main Class.
 */
class GA4 {

	/**
	 * Initialize the class and registers the handlers
	 *
	 * @return void
	 */
	public static function init() {
		Data_Events::register_handler( [ __CLASS__, 'handle_reader_logged_in' ], 'reader_logged_in' );
	}

	/**
	 * Handler for the reader_logged_in event.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 *
	 * @throws \Exception If the event is invalid.
	 * @return void
	 */
	public static function handle_reader_logged_in( $timestamp, $data, $client_id ) {

		$params = array_merge(
			self::get_default_params(),
			[ 'user_id' => $data['user_id'] ]
		);

		$event = new Event( 'reader_login', $params );
		self::send_event( $event, $client_id );
	}

	/**
	 * Get the default parameters that are added to all events
	 *
	 * @return array
	 */
	private static function get_default_params() {
		$params = [
			'logged_in' => is_user_logged_in() ? 'yes' : 'no',
		];

		if ( class_exists( 'Automattic\Jetpack\Device_Detection' ) ) {
			self::log( 'Detecting device using user agent: ' . $_SERVER['HTTP_USER_AGENT'] ?? '(empty)' ); // phpcs:ignore
			$device                = Device_Detection::is_phone() ? 'phone' : ( Device_Detection::is_tablet() ? 'tablet' : 'desktop' );
			$params['device_type'] = $device;
		}
		return $params;
	}

	/**
	 * Gets the credentials for the GA4 API.
	 *
	 * @return array
	 */
	private static function get_credentials() {
		$api_secret     = get_option( 'ga4_api_secret' );
		$measurement_id = get_option( 'ga4_measurement_id' );
		return compact( 'api_secret', 'measurement_id' );
	}

	/**
	 * Gets the API URL for GA4
	 *
	 * @return WP_Error|string
	 */
	public static function get_api_url() {
		$credentials    = self::get_credentials();
		$api_secret     = $credentials['api_secret'];
		$measurement_id = $credentials['measurement_id'];
		if ( ! $api_secret || ! $measurement_id ) {
			return new WP_Error( 'missing_credentials', 'Missing GA4 API credentials.' );
		}
		return add_query_arg(
			[
				'api_secret'     => $api_secret,
				'measurement_id' => $measurement_id,
			],
			'https://www.google-analytics.com/mp/collect'
		);
	}

	/**
	 * Sends an event to GA4.
	 *
	 * @param Event  $event The event object.
	 * @param string $user_id User identifier. Use Reader_Activation::get_client_id().
	 * @throws \Exception If the credentials are missing.
	 * @return void
	 */
	private static function send_event( Event $event, $user_id = null ) {

		$url = self::get_api_url();

		if ( is_wp_error( $url ) ) {
			throw new \Exception( $url->get_error_message() );
		}

		$client_id = self::extract_cid_from_cookies();

		$payload = [
			'client_id' => $client_id,
			'events'    => [
				$event->to_array(),
			],
		];

		if ( $user_id ) {
			$payload['user_id'] = $user_id;
		}

		wp_remote_post(
			$url,
			[
				'body' => wp_json_encode( $payload ),
			]
		);

		self::log( sprintf( 'Event sent - %s', $event->get_name() ) );

	}

	/**
	 * Extracts the Client ID from the _ga cookie
	 *
	 * If the cookie is not found, it will be created
	 *
	 * @return string
	 */
	private static function extract_cid_from_cookies() {

		if ( isset( $_COOKIE['_ga'] ) ) {
			$cookie_pieces = explode( '.', $_COOKIE['_ga'], 3 ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			if ( 1 === count( $cookie_pieces ) ) {
				$cid = reset( $cookie_pieces );
			} else {
				list( $version, $domain_depth, $cid ) = $cookie_pieces;
			}
		} elseif ( isset( $_SERVER['HTTP_HOST'] ) ) {
			$host           = sanitize_text_field( $_SERVER['HTTP_HOST'] );
			$time           = time();
			$cid            = wp_rand( 1000000000, 2147483647 ) . ".{$time}";
			$num_components = count( explode( '.', preg_replace( '/^www\./', '', $host ) ) );
			$ga             = "GA1.{$num_components}.{$cid}";
			setcookie( '_ga', $ga, $time + 63115200, '/', $host, false, false ); // phpcs:ignore
			$_COOKIE['_ga'] = $ga; // phpcs:ignore
		} else {
			$cid = 555;
		}

		return $cid;
	}

	/**
	 * Log a message.
	 *
	 * @param string $message Message to log.
	 */
	private static function log( $message ) {
		Logger::log( $message, 'NEWSPACK-DATA-EVENTS-GA4' );
	}
}

GA4::init();
