<?php
/**
 * Reader Activation Sync Metadata.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync;

use Newspack\Reader_Activation\Sync;
use Newspack\Reader_Activation\ESP_Sync;

defined( 'ABSPATH' ) || exit;

/**
 * Metadata Class.
 */
class Metadata extends Sync {

	const DATE_FORMAT   = 'Y-m-d';
	const PREFIX        = 'NP_';
	const PREFIX_OPTION = '_newspack_metadata_prefix';

	/**
	 * The option name for choosing which metadata fields to sync.
	 *
	 * @var string
	 */
	const FIELDS_OPTION = '_newspack_metadata_fields';

	/**
	 * Metadata keys map for Reader Activation.
	 *
	 * @var array
	 */
	public static $keys = [];

	/**
	 * Get the metadata keys map for Reader Activation.
	 *
	 * @return array List of fields.
	 */
	public static function get_keys() {
		if ( empty( self::$keys ) ) {
			/**
			 * Filters the list of key/value pairs for metadata fields to be synced to the connected ESP.
			 *
			 * @param array $keys The list of key/value pairs for metadata fields to be synced to the connected ESP.
			 */
			self::$keys = \apply_filters( 'newspack_ras_metadata_keys', self::get_all_fields() );
		}
		return self::$keys;
	}

	/**
	 * Fetch the prefix for synced metadata fields.
	 * Default is NP_ but it can be configured in the Reader Activation settings page.
	 *
	 * @return string
	 */
	public static function get_prefix() {
		$prefix = \get_option( self::PREFIX_OPTION, self::PREFIX );

		// Guard against empty strings and falsy values.
		if ( empty( $prefix ) ) {
			return self::PREFIX;
		}

		/**
		 * Filters the string used to prefix custom fields synced.
		 *
		 * @param string $prefix Prefix to prepend the field name.
		 */
		return apply_filters( 'newspack_ras_metadata_prefix', $prefix );
	}

	/**
	 * Update the prefix for synced metadata fields.
	 *
	 * @param string $prefix Value to set.
	 *
	 * @return boolean True if updated, false otherwise.
	 */
	public static function update_prefix( $prefix ) {
		if ( empty( $prefix ) ) {
			$prefix = self::PREFIX;
		}

		return \update_option( self::PREFIX_OPTION, $prefix );
	}

	/**
	 * Get the list of possible fields to be synced.
	 *
	 * @return string[] List of fields.
	 */
	public static function get_default_fields() {
		return array_values( array_unique( array_values( self::get_keys() ) ) );
	}

	/**
	 * Get the list of fields to be synced.
	 *
	 * @return string[] List of fields to be synced.
	 */
	public static function get_fields() {
		return array_values( \get_option( self::FIELDS_OPTION, self::get_default_fields() ) );
	}

	/**
	 * Update the list of fields to be synced.
	 *
	 * @param array $fields List of fields to sync.
	 *
	 * @return boolean True if updated, false otherwise.
	 */
	public static function update_fields( $fields ) {
		// Only allow fields that are in the metadata keys map.
		$fields = array_intersect( self::get_default_fields(), $fields );
		return \update_option( self::FIELDS_OPTION, array_values( $fields ) );
	}

	/**
	 * Get the "raw" unprefixed metadata keys. Only return fields selected to sync.
	 *
	 * @return string[] List of raw metadata keys.
	 */
	public static function get_raw_keys() {
		$fields_to_sync = self::get_fields();
		$raw_keys       = [];

		foreach ( self::get_keys() as $raw_key => $field_name ) {
			if ( in_array( $field_name, $fields_to_sync, true ) ) {
				$raw_keys[] = $raw_key;
			}
		}

		return array_unique( $raw_keys );
	}

	/**
	 * Get the "prefixed" metadata keys. Only return fields selected to sync.
	 *
	 * @return string[] List of prefixed metadata keys.
	 */
	public static function get_prefixed_keys() {
		$fields_to_sync = self::get_fields();
		$prefixed_keys  = [];

		foreach ( self::get_keys() as $raw_key => $field_name ) {
			if ( in_array( $field_name, $fields_to_sync, true ) ) {
				$prefixed_keys[] = self::get_key( $raw_key );
			}
		}

		return array_unique( $prefixed_keys );
	}

	/**
	 * Given a field name, prepend it with the metadata field prefix.
	 *
	 * @param string $key Metadata field to fetch.
	 *
	 * @return string Prefixed field name.
	 */
	public static function get_key( $key ) {
		if ( ! isset( self::get_keys()[ $key ] ) ) {
			return false;
		}

		$prefix = self::get_prefix();
		$name   = self::get_keys()[ $key ];
		$key    = $prefix . $name;

		/**
		 * Filters the full, prefixed field name of each custom field synced to the ESP.
		 *
		 * @param string $key Full, prefixed key.
		 * @param string $prefix The prefix part of the key.
		 * @param string $name The unprefixed part of the key.
		 */
		return apply_filters( 'newspack_ras_metadata_key', $key, $prefix, $name );
	}

	/**
	 * Get basic metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_basic_fields() {
		return [
			'account'              => 'Account',
			'registration_date'    => 'Registration Date',
			'connected_account'    => 'Connected Account',
			'signup_page'          => 'Signup Page',
			'signup_page_utm'      => 'Signup UTM: ',
			'newsletter_selection' => 'Newsletter Selection',
			'referer'              => 'Referrer Path',
			'registration_page'    => 'Registration Page',
			'current_page_url'     => 'Registration Page',
			'registration_method'  => 'Registration Method',
		];
	}

	/**
	 * Get payment-related metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_payment_fields() {
		return [
			'membership_status'   => 'Membership Status',
			'payment_page'        => 'Payment Page',
			'payment_page_utm'    => 'Payment UTM: ',
			'sub_start_date'      => 'Current Subscription Start Date',
			'sub_end_date'        => 'Current Subscription End Date',
			'billing_cycle'       => 'Billing Cycle',
			'recurring_payment'   => 'Recurring Payment',
			'last_payment_date'   => 'Last Payment Date',
			'last_payment_amount' => 'Last Payment Amount',
			'product_name'        => 'Product Name',
			'next_payment_date'   => 'Next Payment Date',
			'total_paid'          => 'Total Paid',
		];
	}

	/**
	 * Get all metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_all_fields() {
		return array_merge( self::get_basic_fields(), self::get_payment_fields() );
	}

	/**
	 * Check if a metadata key exists in the given metadata.
	 *
	 * @param string $key      Metadata key to check.
	 * @param array  $metadata Metadata to check.
	 *
	 * @return boolean
	 */
	private static function has_key( $key, $metadata ) {
		return isset( $metadata[ $key ] ) || isset( $metadata[ self::get_key( $key ) ] );
	}

	/**
	 * Get a metadata key value from the given metadata.
	 *
	 * @param string $key      Metadata key to fetch.
	 * @param array  $metadata Metadata to fetch from.
	 *
	 * @return mixed|null Metadata value or null if not found.
	 */
	private static function get_key_value( $key, $metadata ) {
		if ( isset( $metadata[ $key ] ) ) {
			return $metadata[ $key ];
		}
		if ( isset( $metadata[ self::get_key( $key ) ] ) ) {
			return $metadata[ self::get_key( $key ) ];
		}
		return null;
	}

	/**
	 * Normalizes contact metadata keys before syncing to ESP.
	 *
	 * @param array $contact Contact data.
	 * @return array Normalized contact data.
	 */
	public static function normalize_contact_metadata( $contact ) {
		if ( ! isset( $contact['metadata'] ) ) {
			$contact['metadata'] = [];
		}

		$metadata            = $contact['metadata'];
		$normalized_metadata = [];
		$raw_keys            = self::get_raw_keys();
		$prefixed_keys       = self::get_prefixed_keys();

		// Capture UTM params and signup/payment page URLs as meta for registration or payment.
		if ( self::has_key( 'current_page_url', $metadata ) || self::has_key( 'payment_page', $metadata ) ) {
			$is_payment = self::has_key( 'payment_page', $metadata );
			$raw_url    = false;
			if ( $is_payment ) {
				$raw_url = self::get_key_value( 'payment_page', $metadata );
			} else {
				$raw_url = self::get_key_value( 'current_page_url', $metadata );
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
						$key   = self::get_key( $utm_key_prefix ) . $param;
						if ( ! isset( $metadata[ $key ] ) || empty( $metadata[ $key ] ) ) {
							$metadata[ $key ] = $value;
						}
					}
				}
			}
		}

		foreach ( $metadata as $meta_key => $meta_value ) {
			if ( in_array( $meta_key, $raw_keys, true ) ) {
				$normalized_metadata[ self::get_key( $meta_key ) ] = $meta_value; // If passed a raw key, map it to the prefixed key.
			} elseif (
				in_array( $meta_key, $prefixed_keys, true ) ||
				(
					// UTM meta keys can have arbitrary suffixes.
					( in_array( self::get_key( 'signup_page_utm' ), $prefixed_keys, true ) && false !== strpos( $meta_key, self::get_key( 'signup_page_utm' ) ) ) ||
					( in_array( self::get_key( 'payment_page_utm' ), $prefixed_keys, true ) && false !== strpos( $meta_key, self::get_key( 'payment_page_utm' ) ) )
				)
			) {
				$normalized_metadata[ $meta_key ] = $meta_value;
			}
		}

		// Ensure status is passed, if given.
		if ( isset( $metadata['status'] ) ) {
			$normalized_metadata['status'] = $metadata['status'];
		}
		if ( isset( $metadata['status_if_new'] ) ) {
			$normalized_metadata['status_if_new'] = $metadata['status_if_new'];
		}

		$contact['metadata'] = $normalized_metadata;

		// Parse full name into first + last for MC, which stores these as separate merge fields.
		// TODO Move this to Newspack Newsletters.
		if ( 'mailchimp' === \get_option( 'newspack_newsletters_service_provider', false ) ) {
			if ( isset( $contact['name'] ) ) {
				$name_fragments                    = explode( ' ', $contact['name'], 2 );
				$contact['metadata']['First Name'] = $name_fragments[0];
				if ( isset( $name_fragments[1] ) ) {
					$contact['metadata']['Last Name'] = $name_fragments[1];
				}
			}
		}

		static::log( 'Normalizing contact data for reader ESP sync:' );
		static::log( $contact );

		/**
		 * Filters the normalized contact data before syncing to the ESP.
		 *
		 * @param array $contact Contact data.
		 */
		return apply_filters( 'newspack_esp_sync_normalize_contact', $contact );
	}
}
