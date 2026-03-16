<?php
/**
 * Reader Activation Sync Metadata.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync;

use Newspack\Donations;
use Newspack\Reader_Activation\Integrations;

defined( 'ABSPATH' ) || exit;

/**
 * Metadata Class.
 */
class Metadata {

	const DATE_FORMAT   = 'Y-m-d H:i:s';
	const PREFIX        = 'NP_';
	const PREFIX_OPTION = '_newspack_metadata_prefix';

	/**
	 * The schema version for the metadata. Legacy is the default and fallsback to how things were before Newspack Integrations.
	 *
	 * @var string
	 */
	public static $version = 'legacy';

	/**
	 * The option name for choosing which metadata fields to sync.
	 *
	 * @var string
	 */
	const FIELDS_OPTION = '_newspack_metadata_fields';

	/**
	 * Get the current metadata schema version.
	 *
	 * @return string
	 */
	protected static function get_version() {
		if ( defined( 'NEWSPACK_SYNC_METADATA_VERSION' ) ) {
			return NEWSPACK_SYNC_METADATA_VERSION;
		}

		// boolean version of the feature flag.
		if ( defined( 'NEWSPACK_SYNC_METADATA_VERSION_1' ) && NEWSPACK_SYNC_METADATA_VERSION_1 ) {
			return '1.0';
		}

		return self::$version;
	}

	/**
	 * Get the metadata keys map for Reader Activation.
	 *
	 * @return array List of fields.
	 */
	public static function get_keys() {
		if ( 'legacy' === self::get_version() ) {
			return Legacy_Metadata::get_keys();
		}

		return self::get_all_fields();
	}

	/**
	 * Fetch the prefix for synced metadata fields.
	 * Default is NP_ but it can be configured in the Reader Activation settings page.
	 *
	 * This method is deprecated. Now, each integration has its own metadata prefix, which can be retrieved with Integration::get_metadata_prefix().
	 * As a fallback, this method returns the metadata prefix for the ESP Integration.
	 *
	 * @deprecated Use Integration::get_metadata_prefix() instead.
	 *
	 * @return string
	 */
	public static function get_prefix() {
		$esp_integration = Integrations::get_integration( 'esp' );
		if ( $esp_integration ) {
			$prefix = $esp_integration->get_metadata_prefix();
			if ( ! empty( $prefix ) ) {
				/** This filter is documented below. */
				return apply_filters( 'newspack_ras_metadata_prefix', $prefix );
			}
		}

		// Fallback for edge case where integration isn't registered yet (before init priority 5).
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
		$esp_integration = Integrations::get_integration( 'esp' );
		return $esp_integration ? $esp_integration->update_metadata_prefix( $prefix ) : false;
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
	 * Get payment-related metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_payment_fields() {
		// Not sure yet if this method will be useful in the new schema, so keeping it here for now.
		// It's used in the Woocommerce class when we want to clear payment fields, so we might still need to have a list of "Woocommerce related fields".
		return Legacy_Metadata::get_payment_fields();
	}

	/**
	 * Get the list of fields to be synced.
	 *
	 * This method is deprecated. Now, each integration has its own set of enabled fields, which can be retrieved with Integration::get_enabled_outgoing_fields().
	 * As a fallback, this method returns the fields enabled for the ESP Integration.
	 *
	 * @deprecated Use Integration::get_enabled_outgoing_fields() instead.
	 * @return string[] List of fields to be synced.
	 */
	public static function get_fields() {
		$esp_integration = Integrations::get_integration( 'esp' );
		return $esp_integration ? $esp_integration->get_enabled_outgoing_fields() : [];
	}

	/**
	 * Get enabled fields which match provided keys.
	 * Will return key-value pairs of enabled fields which match the keys provided.
	 *
	 * This method is deprecated. Now, each integration has its own set of enabled fields.
	 * As a fallback, this method delegates to the ESP Integration.
	 *
	 * @deprecated Use Integration::filter_enabled_outgoing_fields() instead.
	 * @param string[] $keys Array of keys to match.
	 */
	public static function filter_enabled_fields( $keys ) {
		$esp_integration = Integrations::get_integration( 'esp' );
		return $esp_integration ? $esp_integration->filter_enabled_outgoing_fields( $keys ) : [];
	}

	/**
	 * Update the list of fields to be synced.
	 *
	 * This method is deprecated. Now, each integration has its own set of enabled fields.
	 * As a fallback, this method will update the fields enabled for the ESP Integration.
	 *
	 * @param array $fields List of fields to sync.
	 *
	 * @deprecated Use Integration::update_enabled_outgoing_fields() instead.
	 * @return boolean True if updated, false otherwise.
	 */
	public static function update_fields( $fields ) {
		$esp_integration = Integrations::get_integration( 'esp' );
		return $esp_integration ? $esp_integration->update_enabled_outgoing_fields( $fields ) : false;
	}

	/**
	 * Get the "raw" unprefixed metadata keys. Only return fields selected to sync.
	 *
	 * This method is deprecated. Now, each integration has its own set of enabled fields.
	 * As a fallback, this method delegates to the ESP Integration.
	 *
	 * @deprecated Use Integration::get_enabled_outgoing_fields_keys() instead.
	 * @return string[] List of raw metadata keys.
	 */
	public static function get_raw_keys() {
		$esp_integration = Integrations::get_integration( 'esp' );
		return $esp_integration ? $esp_integration->get_enabled_outgoing_fields_keys() : [];
	}

	/**
	 * Get the "prefixed" metadata keys. Only return fields selected to sync.
	 *
	 * This method is deprecated. Now, each integration has its own set of enabled fields.
	 * As a fallback, this method delegates to the ESP Integration.
	 *
	 * @deprecated Use Integration::get_enabled_outgoing_fields_keys() instead.
	 * @return string[] List of prefixed metadata keys.
	 */
	public static function get_prefixed_keys() {
		$esp_integration = Integrations::get_integration( 'esp' );
		return $esp_integration ? $esp_integration->get_enabled_outgoing_fields_keys( true ) : [];
	}

	/**
	 * Get all "prefixed" metadata keys.
	 *
	 * @return string[] List of prefixed metadata keys.
	 */
	public static function get_all_prefixed_keys() {
		$prefixed_keys = [];

		foreach ( self::get_keys() as $raw_key => $field_name ) {
			$prefixed_keys[] = self::get_key( $raw_key );
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
	 * Get all metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_all_fields() {
		if ( 'legacy' === self::get_version() ) {
			return Legacy_Metadata::get_all_fields();
		}

		return [
			'first_name' => 'First Name',
			'last_name'  => 'Last Name',
			'full_name'  => 'Full Name',
		];
	}



	/**
	 * Check if a metadata key exists in the given metadata.
	 *
	 * This method checks for both raw and prefixed keys.
	 *
	 * @param string $key      Metadata key to check.
	 * @param array  $metadata Metadata to check.
	 *
	 * @return boolean
	 */
	public static function has_key( $key, $metadata ) {
		return isset( $metadata[ $key ] ) || isset( $metadata[ self::get_key( $key ) ] );
	}

	/**
	 * Get a metadata key value from the given metadata.
	 *
	 * This method checks for both raw and prefixed keys.
	 *
	 * @param string $key      Metadata key to fetch.
	 * @param array  $metadata Metadata to fetch from.
	 *
	 * @return mixed|null Metadata value or null if not found.
	 */
	public static function get_key_value( $key, $metadata ) {
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
	public static function normalize_contact_data( $contact ) {
		if ( 'legacy' === self::get_version() ) {
			return Legacy_Metadata::normalize_contact_data( $contact );
		}

		if ( ! isset( $contact['metadata'] ) ) {
			$contact['metadata'] = [];
		}

		// TODO: Do something new.
		return $contact;
	}
}
