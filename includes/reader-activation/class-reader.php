<?php
/**
 * Reader Entity Class.
 *
 * A unified wrapper around WP_User for reader-specific data,
 * analogous to WooCommerce's WC_Customer.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Reader_Activation\Sync;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Class.
 */
class Reader {

	/**
	 * User meta key prefix.
	 */
	const META_PREFIX = 'np_reader_';

	/**
	 * Meta keys for reader-specific data.
	 */
	const META_KEYS = [
		'registration_method' => 'np_reader_registration_method',
		'connected_account'   => 'np_reader_connected_account',
		'email_verified'      => 'np_reader_email_verified',
		'without_password'    => 'np_reader_without_password',
		'registration_page'   => 'np_reader_registration_page',
		'signup_page_utms'    => 'np_reader_signup_page_utms',
	];

	/**
	 * The WordPress user object.
	 *
	 * @var \WP_User
	 */
	private $user;

	/**
	 * The user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Loaded meta data.
	 *
	 * @var array
	 */
	private $data = [];

	/**
	 * Keys that have been modified since load.
	 *
	 * @var array
	 */
	private $dirty = [];

	/**
	 * Constructor.
	 *
	 * @param int|string|\WP_User $user_id_or_email User ID, email, or WP_User object.
	 *
	 * @throws \InvalidArgumentException If the user cannot be found.
	 */
	public function __construct( $user_id_or_email ) {
		if ( $user_id_or_email instanceof \WP_User ) {
			$this->user = $user_id_or_email;
		} elseif ( is_numeric( $user_id_or_email ) ) {
			$this->user = \get_userdata( (int) $user_id_or_email );
		} elseif ( is_string( $user_id_or_email ) && is_email( $user_id_or_email ) ) {
			$this->user = \get_user_by( 'email', $user_id_or_email );
		}

		if ( ! $this->user || ! $this->user->ID ) {
			throw new \InvalidArgumentException( 'Invalid user.' );
		}

		$this->user_id = $this->user->ID;
		$this->load_data();
	}

	/**
	 * Static factory that returns false instead of throwing.
	 *
	 * @param int|string|\WP_User $user_id_or_email User ID, email, or WP_User object.
	 *
	 * @return Reader|false Reader instance or false if user not found.
	 */
	public static function get( $user_id_or_email ) {
		try {
			return new self( $user_id_or_email );
		} catch ( \InvalidArgumentException $e ) {
			return false;
		}
	}

	/**
	 * Load reader data from user meta.
	 */
	private function load_data() {
		foreach ( self::META_KEYS as $prop => $meta_key ) {
			$this->data[ $prop ] = \get_user_meta( $this->user_id, $meta_key, true );
		}
	}

	// -- Core identity --

	/**
	 * Get the user ID.
	 *
	 * @return int
	 */
	public function get_id() {
		return $this->user_id;
	}

	/**
	 * Get the user email.
	 *
	 * @return string
	 */
	public function get_email() {
		return $this->user->user_email;
	}

	/**
	 * Get the user's full name.
	 *
	 * @return string
	 */
	public function get_name() {
		$first = $this->get_first_name();
		$last  = $this->get_last_name();
		return trim( "$first $last" );
	}

	/**
	 * Get the user's first name.
	 *
	 * @return string
	 */
	public function get_first_name() {
		return $this->user->first_name;
	}

	/**
	 * Get the user's last name.
	 *
	 * @return string
	 */
	public function get_last_name() {
		return $this->user->last_name;
	}

	/**
	 * Get the user's registration date.
	 *
	 * @return string
	 */
	public function get_registration_date() {
		return $this->user->user_registered;
	}

	// -- Registration metadata --

	/**
	 * Get the registration page URL.
	 *
	 * @return string
	 */
	public function get_registration_page() {
		return ! empty( $this->data['registration_page'] ) ? $this->data['registration_page'] : '';
	}

	/**
	 * Set the registration page URL.
	 *
	 * @param string $url The registration page URL.
	 */
	public function set_registration_page( $url ) {
		$this->data['registration_page']  = \esc_url_raw( $url );
		$this->dirty['registration_page'] = true;
	}

	/**
	 * Get the registration method.
	 *
	 * @return string
	 */
	public function get_registration_method() {
		return ! empty( $this->data['registration_method'] ) ? $this->data['registration_method'] : '';
	}

	/**
	 * Set the registration method.
	 *
	 * @param string $method The registration method.
	 */
	public function set_registration_method( $method ) {
		$this->data['registration_method']  = \sanitize_text_field( $method );
		$this->dirty['registration_method'] = true;
	}

	/**
	 * Get the signup page UTM parameters.
	 *
	 * @return array Associative array of UTM params.
	 */
	public function get_signup_utms() {
		$utms = $this->data['signup_page_utms'];
		if ( empty( $utms ) ) {
			return [];
		}
		if ( is_string( $utms ) ) {
			$decoded = json_decode( $utms, true );
			return is_array( $decoded ) ? $decoded : [];
		}
		return is_array( $utms ) ? $utms : [];
	}

	/**
	 * Set the signup page UTM parameters.
	 *
	 * @param array $utms Associative array of UTM params.
	 */
	public function set_signup_utms( $utms ) {
		$this->data['signup_page_utms']  = $utms;
		$this->dirty['signup_page_utms'] = true;
	}

	/**
	 * Extract and set UTM parameters from a URL.
	 *
	 * @param string $url The URL to extract UTMs from.
	 */
	public function set_signup_utms_from_url( $url ) {
		if ( empty( $url ) ) {
			return;
		}
		$parsed = \wp_parse_url( $url );
		if ( empty( $parsed['query'] ) ) {
			return;
		}
		$params = [];
		\wp_parse_str( $parsed['query'], $params );
		$utms = [];
		foreach ( $params as $key => $value ) {
			if ( 0 === strpos( $key, 'utm_' ) ) {
				$utms[ str_replace( 'utm_', '', $key ) ] = \sanitize_text_field( $value );
			}
		}
		if ( ! empty( $utms ) ) {
			$this->set_signup_utms( $utms );
		}
	}

	// -- Account state --

	/**
	 * Check if the reader's email is verified.
	 *
	 * @return bool
	 */
	public function is_verified() {
		return (bool) $this->data['email_verified'];
	}

	/**
	 * Check if the reader has set a password.
	 *
	 * @return bool
	 */
	public function has_password() {
		return ! (bool) $this->data['without_password'];
	}

	/**
	 * Get the connected account (SSO provider).
	 *
	 * @return string
	 */
	public function get_connected_account() {
		return ! empty( $this->data['connected_account'] ) ? $this->data['connected_account'] : '';
	}

	/**
	 * Set the connected account.
	 *
	 * @param string $account The connected account identifier.
	 */
	public function set_connected_account( $account ) {
		$this->data['connected_account']  = \sanitize_text_field( $account );
		$this->dirty['connected_account'] = true;
	}

	// -- Contact data assembly --

	/**
	 * Assemble complete contact data for ESP sync.
	 *
	 * This is the unified method that replaces the scattered contact data
	 * assembly across Contact_Sync::get_contact_data() and
	 * Sync\WooCommerce::get_contact_from_customer().
	 *
	 * @return array Contact data array with 'email', 'name', and 'metadata' keys.
	 */
	public function get_contact_data() {
		$metadata = [
			'account'           => $this->user_id,
			'registration_date' => $this->get_registration_date(),
		];

		// Registration metadata (always persisted, available on retry).
		$registration_page = $this->get_registration_page();
		if ( ! empty( $registration_page ) ) {
			$metadata['registration_page'] = $registration_page;
		}

		$registration_method = $this->get_registration_method();
		if ( ! empty( $registration_method ) ) {
			$metadata['registration_method'] = $registration_method;
		}

		$connected_account = $this->get_connected_account();
		if ( ! empty( $connected_account ) ) {
			$metadata['connected_account'] = $connected_account;
		}

		// Signup UTMs as individual keys for metadata normalization.
		$utms = $this->get_signup_utms();
		foreach ( $utms as $key => $value ) {
			$metadata[ 'signup_page_utm_' . $key ] = $value;
		}

		// Payment data from WooCommerce when available.
		if ( class_exists( '\WC_Customer' ) ) {
			$customer = new \WC_Customer( $this->user_id );
			if ( $customer && $customer->get_id() ) {
				$wc_contact = Sync\WooCommerce::get_contact_from_customer( $customer );
				if ( $wc_contact && ! empty( $wc_contact['metadata'] ) ) {
					// WC metadata includes account, registration_date, and total_paid.
					// Merge but let our persisted data take precedence for registration fields.
					$metadata = array_merge( $wc_contact['metadata'], $metadata );
				}
			}
		}

		$contact = [
			'email'    => $this->get_email(),
			'metadata' => $metadata,
		];

		$name = $this->get_name();
		if ( ! empty( $name ) ) {
			$contact['name'] = $name;
		}

		return $contact;
	}

	// -- Persistence --

	/**
	 * Save dirty properties to user meta.
	 *
	 * @return bool True if any data was saved.
	 */
	public function save() {
		if ( empty( $this->dirty ) ) {
			return false;
		}

		foreach ( $this->dirty as $prop => $_ ) {
			$meta_key = self::META_KEYS[ $prop ] ?? null;
			if ( ! $meta_key ) {
				continue;
			}
			$value = $this->data[ $prop ];
			if ( is_array( $value ) ) {
				$value = \wp_json_encode( $value );
			}
			\update_user_meta( $this->user_id, $meta_key, $value );
		}

		$this->dirty = [];
		return true;
	}
}
