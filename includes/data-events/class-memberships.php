<?php
/**
 * Newspack Data Events Content Gate and Memberships helper.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events;

use Newspack_Popups_Data_Api;
use Newspack\Data_Events;
use WP_Error;

/**
 * Data Events Memberships Class
 */
final class Memberships {

	const METADATA_NAME = 'memberships_content_gate';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_listeners' ] );
	}

	/**
	 * Register listeners.
	 */
	public static function register_listeners() {
		Data_Events::register_listener(
			'newspack_reader_registration_form_processed',
			'gate_interaction',
			[ __CLASS__, 'registration_submission' ]
		);

		Data_Events::register_listener(
			'newspack_reader_registration_form_processed',
			'gate_interaction',
			[ __CLASS__, 'registration_submission_with_status' ]
		);

		Data_Events::register_listener(
			'newspack_newsletters_subscribe_form_processed',
			'gate_interaction',
			[ __CLASS__, 'newsletter_submission' ]
		);

		Data_Events::register_listener(
			'newspack_newsletters_subscribe_form_processed',
			'gate_interaction',
			[ __CLASS__, 'newsletter_submission_with_status' ]
		);
	}

	/**
	 * Whether the metadata array has the gate_interaction key
	 *
	 * @param array $metadata The metadata array.
	 *
	 * @return bool
	 */
	private static function has_metadata( $metadata ) {
		return isset( $metadata[ self::METADATA_NAME ] );
	}

	/**
	 * A listener for the registration block form submission
	 *
	 * Will trigger the event with "form_submission" as action in all cases.
	 *
	 * @param string              $email   Email address of the reader.
	 * @param int|false|\WP_Error $user_id The created user ID in case of registration, false if not created or a WP_Error object.
	 * @param array               $metadata Array with metadata about the user being registered.
	 * @return ?array
	 */
	public static function registration_submission( $email, $user_id, $metadata ) {
		if ( ! self::has_metadata( $metadata ) ) {
			return;
		}
		$popup_data = Newspack_Popups_Data_Api::get_popup_metadata( $popup_id );
		$popup_data = array_merge(
			$popup_data,
			[
				'action'      => self::FORM_SUBMISSION,
				'action_type' => 'registration',
				'referer'     => $metadata['referer'],
			]
		);
		$popup_data['interaction_data']['registration_method'] = $metadata['registration_method'];
		return $popup_data;
	}

	/**
	 * A listener for the registration block form submission
	 *
	 * Will trigger the event with "form_submission_success" or "form_submission_failure" as action.
	 *
	 * @param string              $email   Email address of the reader.
	 * @param int|false|\WP_Error $user_id The created user ID in case of registration, false if not created or a WP_Error object.
	 * @param array               $metadata Array with metadata about the user being registered.
	 * @return ?array
	 */
	public static function registration_submission_with_status( $email, $user_id, $metadata ) {
		if ( ! self::has_metadata( $metadata ) ) {
			return;
		}
		$action = self::FORM_SUBMISSION_SUCCESS;
		if ( ! $user_id || \is_wp_error( $user_id ) ) {
			$action = self::FORM_SUBMISSION_FAILURE;
		}
		$popup_data = Newspack_Popups_Data_Api::get_popup_metadata( $popup_id );
		$popup_data = array_merge(
			$popup_data,
			[
				'action'      => $action,
				'action_type' => 'registration',
				'referer'     => $metadata['referer'],
			]
		);
		$popup_data['interaction_data']['registration_method'] = $metadata['registration_method'];
		return $popup_data;
	}

	/**
	 * A listener for the registration block form submission
	 *
	 * Will trigger the event with "form_submission" as action in all cases.
	 *
	 * @param string         $email  Email address of the reader.
	 * @param array|WP_Error $result Contact data if it was added, or error otherwise.
	 * @param array          $metadata Some metadata about the subscription. Always contains `current_page_url` and `newsletters_subscription_method` keys.
	 * @return ?array
	 */
	public static function newsletter_submission( $email, $result, $metadata = [] ) {
		if ( ! self::has_metadata( $metadata ) ) {
			return;
		}
		$popup_data = Newspack_Popups_Data_Api::get_popup_metadata( $popup_id );
		$popup_data = array_merge(
			$popup_data,
			[
				'action'      => self::FORM_SUBMISSION,
				'action_type' => 'newsletters_subscription',
				'referer'     => $metadata['current_page_url'],
			]
		);
		$popup_data['interaction_data']['newsletters_subscription_method'] = $metadata['newsletters_subscription_method'];
		return $popup_data;
	}

	/**
	 * A listener for the registration block form submission
	 *
	 * Will trigger the event with "form_submission_success" or "form_submission_failure" as action.
	 *
	 * @param string         $email  Email address of the reader.
	 * @param array|WP_Error $result Contact data if it was added, or error otherwise.
	 * @param array          $metadata Some metadata about the subscription. Always contains `current_page_url` and `newsletters_subscription_method` keys.
	 * @return ?array
	 */
	public static function newsletter_submission_with_status( $email, $result, $metadata = [] ) {
		if ( ! self::has_metadata( $metadata ) ) {
			return;
		}
		$action = self::FORM_SUBMISSION_SUCCESS;
		if ( ! $result || \is_wp_error( $result ) ) {
			$action = self::FORM_SUBMISSION_FAILURE;
		}
		$popup_data = Newspack_Popups_Data_Api::get_popup_metadata( $popup_id );
		$popup_data = array_merge(
			$popup_data,
			[
				'action'      => $action,
				'action_type' => 'newsletters_subscription',
				'referer'     => $metadata['current_page_url'],
			]
		);
		$popup_data['interaction_data']['newsletters_subscription_method'] = $metadata['newsletters_subscription_method'];
		return $popup_data;
	}
}
Memberships::init();
