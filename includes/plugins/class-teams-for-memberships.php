<?php
/**
 * Teams for Memberships integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Teams_For_Memberships {

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'newspack_ras_metadata_keys', [ __CLASS__, 'add_teams_metadata_keys' ] );
		add_filter( 'newspack_esp_sync_normalize_contact', [ __CLASS__, 'normalize_contact' ] );
	}

	/**
	 * Check if Teams for Memberships is enabled.
	 *
	 * @return bool True if enabled, false otherwise.
	 */
	private static function is_enabled() {
		return class_exists( 'WC_Memberships_For_Teams_Loader' );
	}

	/**
	 * Add Teams metadata keys.
	 *
	 * @param array $metadata_keys Metadata keys.
	 * @return array Metadata keys.
	 */
	public static function add_teams_metadata_keys( $metadata_keys ) {
		if ( self::is_enabled() ) {
			$metadata_keys['woo_team'] = 'Woo Team';
		}
		return $metadata_keys;
	}

	/**
	 * Normalize contact data.
	 *
	 * @param array $contact Contact data.
	 * @return array Normalized contact data.
	 */
	public static function normalize_contact( $contact ) {
		if ( ! self::is_enabled() ) {
			return $contact;
		}

		if ( empty( $contact['email'] ) ) {
			return $contact;
		}

		$user = \get_user_by( 'email', $contact['email'] );

		if ( ! $user ) {
			return $contact;
		}

		if ( ! isset( $contact['metadata'] ) ) {
			$contact['metadata'] = [];
		}

		$existing_membership_teams = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare( "SELECT * FROM $wpdb->postmeta WHERE meta_key = '_member_id' AND meta_value = %d", $user->ID ),
			ARRAY_A
		);
		if ( empty( $existing_membership_teams ) || empty( $existing_membership_teams[0] ) ) {
			return $contact;
		}
		$team_id = $existing_membership_teams[0]['post_id'];
		$team    = get_post( $team_id );
		if ( $team ) {
			$contact['metadata'][ Newspack_Newsletters::get_metadata_key( 'woo_team' ) ] = $team->post_title;
		}

		return $contact;
	}
}

Teams_For_Memberships::init();
