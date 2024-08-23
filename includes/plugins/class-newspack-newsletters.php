<?php
/**
 * Newspack Newsletters integration class.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Reader_Activation\ESP_Sync;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Newspack_Newsletters {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		\add_action( 'init', [ __CLASS__, 'setup_hooks' ], 15 );
	}

	/**
	 * Setup hooks.
	 */
	public static function setup_hooks() {
		\add_filter( 'newspack_newsletters_contact_data', [ __CLASS__, 'normalize_contact_data' ], 99 );

		// this condition triggers filters that should not be fired before init.
		if ( ESP_Sync::can_esp_sync() ) {
			\add_filter( 'newspack_newsletters_contact_lists', [ __CLASS__, 'add_activecampaign_master_list' ], 10, 3 );
		}
	}

	/**
	 * Normalizes contact metadata keys before syncing to ESP. If RAS is enabled, we should favor RAS metadata keys.
	 *
	 * @param array $contact Contact data.
	 * @return array Normalized contact data.
	 */
	public static function normalize_contact_data( $contact ) {
		// If syncing for RAS, ensure that metadata keys are normalized with the correct RAS metadata keys.
		if ( isset( $contact['metadata'] ) ) {
			$normalized_metadata = [];
			$raw_keys            = ESP_Sync::get_raw_metadata_keys();
			$prefixed_keys       = ESP_Sync::get_prefixed_metadata_keys();

			// Capture UTM params and signup/payment page URLs as meta for registration or payment.
			if (
				isset( $contact['metadata']['current_page_url'] ) ||
				isset( $contact['metadata'][ ESP_Sync::get_metadata_key( 'current_page_url' ) ] ) ||
				isset( $contact['metadata']['payment_page'] ) ||
				isset( $contact['metadata'][ ESP_Sync::get_metadata_key( 'payment_page' ) ] )
			) {
				$is_payment = isset( $contact['metadata']['payment_page'] ) || isset( $contact['metadata'][ ESP_Sync::get_metadata_key( 'payment_page' ) ] );
				$raw_url    = false;
				if ( $is_payment ) {
					$raw_url = isset( $contact['metadata']['payment_page'] ) ? $contact['metadata']['payment_page'] : $contact['metadata'][ ESP_Sync::get_metadata_key( 'payment_page' ) ];
				} else {
					$raw_url = isset( $contact['metadata']['current_page_url'] ) ? $contact['metadata']['current_page_url'] : $contact['metadata'][ ESP_Sync::get_metadata_key( 'current_page_url' ) ];
				}

				$parsed_url = \wp_parse_url( $raw_url );

				// Maybe set UTM meta.
				if ( ! empty( $parsed_url['query'] ) ) {
					$utm_key_prefix = $is_payment ? 'payment_page_utm' : 'signup_page_utm';
					$params         = [];
					\wp_parse_str( $parsed_url['query'], $params );
					foreach ( $params as $param => $value ) {
						$param = \sanitize_text_field( $param );
						if ( 'utm' === substr( $param, 0, 3 ) ) {
							$param = str_replace( 'utm_', '', $param );
							$key   = ESP_Sync::get_metadata_key( $utm_key_prefix ) . $param;
							if ( ! isset( $contact['metadata'][ $key ] ) || empty( $contact['metadata'][ $key ] ) ) {
								$contact['metadata'][ $key ] = $value;
							}
						}
					}
				}
			}

			foreach ( $contact['metadata'] as $meta_key => $meta_value ) {
				if ( ESP_Sync::can_esp_sync() ) {
					if ( in_array( $meta_key, $raw_keys, true ) ) {
						$normalized_metadata[ ESP_Sync::get_metadata_key( $meta_key ) ] = $meta_value; // If passed a raw key, map it to the prefixed key.
					} elseif (
						in_array( $meta_key, $prefixed_keys, true ) ||
						(
							// UTM meta keys can have arbitrary suffixes.
							( in_array( ESP_Sync::get_metadata_key( 'signup_page_utm' ), $prefixed_keys, true ) && false !== strpos( $meta_key, ESP_Sync::get_metadata_key( 'signup_page_utm' ) ) ) ||
							( in_array( ESP_Sync::get_metadata_key( 'payment_page_utm' ), $prefixed_keys, true ) && false !== strpos( $meta_key, ESP_Sync::get_metadata_key( 'payment_page_utm' ) ) )
						)
					) {
						$normalized_metadata[ $meta_key ] = $meta_value;
					}
				} else { // phpcs:ignore Universal.ControlStructures.DisallowLonelyIf.Found
					// If not syncing for RAS, we only want to sync email (for all ESPs) + First/Last Name (for MC only).
					if ( in_array( $meta_key, [ 'First Name', 'Last Name' ], true ) ) {
						$normalized_metadata[ $meta_key ] = $meta_value;
					}
				}
			}

			// Ensure status is passed, if given.
			if ( isset( $contact['metadata']['status'] ) ) {
				$normalized_metadata['status'] = $contact['metadata']['status'];
			}
			if ( isset( $contact['metadata']['status_if_new'] ) ) {
				$normalized_metadata['status_if_new'] = $contact['metadata']['status_if_new'];
			}

			$contact['metadata'] = $normalized_metadata;
		}

		// Parse full name into first + last for MC, which stores these as separate merge fields.
		if ( 'mailchimp' === \get_option( 'newspack_newsletters_service_provider', false ) ) {
			if ( isset( $contact['name'] ) ) {
				if ( ! isset( $contact['metadata'] ) ) {
					$contact['metadata'] = [];
				}
				$name_fragments                    = explode( ' ', $contact['name'], 2 );
				$contact['metadata']['First Name'] = $name_fragments[0];
				if ( isset( $name_fragments[1] ) ) {
					$contact['metadata']['Last Name'] = $name_fragments[1];
				}
			}
		}

		Logger::log( 'Normalizing contact data for reader ESP sync:' );
		Logger::log( $contact );

		/**
		 * Filters the normalized contact data before syncing to the ESP.
		 *
		 * @param array $contact Contact data.
		 */
		return apply_filters( 'newspack_esp_sync_normalize_contact', $contact );
	}

	/**
	 * Ensure the contact is always added to ActiveCampaign's selected master list.
	 *
	 * @param string[]|false $lists    Array of list IDs the contact will be subscribed to, or false.
	 * @param array          $contact  {
	 *    Contact information.
	 *
	 *    @type string   $email                 Contact email address.
	 *    @type string   $name                  Contact name. Optional.
	 *    @type string   $existing_contact_data Existing contact data, if updating a contact. The hook will be also called when
	 *    @type string[] $metadata              Contact additional metadata. Optional.
	 * }
	 * @param string         $provider The provider name.
	 *
	 * @return string[]|false
	 */
	public static function add_activecampaign_master_list( $lists, $contact, $provider ) {
		if ( 'active_campaign' !== $provider ) {
			return $lists;
		}
		$master_list_id = Reader_Activation::get_setting( 'active_campaign_master_list' );
		if ( ! $master_list_id ) {
			return $lists;
		}
		if ( empty( $lists ) ) {
			return [ $master_list_id ];
		}
		if ( array_search( $master_list_id, $lists ) === false ) {
			$lists[] = $master_list_id;
		}
		return $lists;
	}
}
Newspack_Newsletters::init();
