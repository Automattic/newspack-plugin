<?php
/**
 * Newspack Data Events ActiveCampaign Connector.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events\Connectors;

use \Newspack\Data_Events;

/**
 * Main Class.
 */
final class ActiveCampaign {

	const ENDPOINT = 'https://trackcmp.net/event';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', [ __CLASS__, 'register_handlers' ] );
	}

	/**
	 * Register handlers.
	 */
	public static function register_handlers() {
		Data_Events::register_handler( [ __CLASS__, 'handler' ] );
	}

	/**
	 * Get tracking credentials
	 *
	 * @return array|false Tracking credentials or false if not set.
	 */
	public static function get_tracking_credentials() {
		if ( ! defined( 'NEWSPACK_AC_TRACKING_ACTID' ) || ! defined( 'NEWSPACK_AC_TRACKING_KEY' ) ) {
			return false;
		}
		return [
			'actid' => NEWSPACK_AC_TRACKING_ACTID,
			'key'   => NEWSPACK_AC_TRACKING_KEY,
		];
	}

	/**
	 * Get event data given the action name and payload.
	 *
	 * @param string $action_name Action name.
	 * @param array  $data        Data.
	 *
	 * @return string|null Event data.
	 */
	public static function get_event_data( $action_name, $data ) {
		switch ( $action_name ) {
			case 'newsletter_subscribed':
				return implode( ',', $data['lists'] );
			case 'donation_new':
				return $data['amount'];
			default:
				return null;
		}
	}

	/**
	 * Handler.
	 *
	 * @param string $action_name Action name.
	 * @param int    $timestamp   Timestamp.
	 * @param array  $data        Data.
	 * @param int    $client_id   Client ID.
	 */
	public static function handler( $action_name, $timestamp, $data, $client_id ) {
		$credentials = self::get_tracking_credentials();
		if ( empty( $credentials ) ) {
			return;
		}
		if ( empty( $data['email'] ) ) {
			return;
		}
		$payload = [
			'actid'     => $credentials['actid'],
			'key'       => $credentials['key'],
			'event'     => $action_name,
			'eventdata' => self::get_event_data( $action_name, $data ),
			'visit'     => wp_json_encode(
				[
					'email' => $data['email'],
				]
			),
		];
		\wp_remote_post(
			self::ENDPOINT,
			[
				'body' => $payload,
			]
		);
	}
}
new ActiveCampaign();
