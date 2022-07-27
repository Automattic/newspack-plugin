<?php
/**
 * Newspack Newsletters integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Newspack_Newsletters {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( Reader_Activation::is_enabled() ) {
			\add_action( 'newspack_newsletters_before_add_contact', [ __CLASS__, 'register_newsletters_contact' ], 10, 2 );
			\add_action( 'newspack_newsletters_update_contact_lists', [ __CLASS__, 'newspack_newsletters_update_contact_lists' ], 10, 5 );
			\add_filter( 'newspack_newsletters_contact_data', [ __CLASS__, 'newspack_newsletters_contact_data' ], 10, 3 );
		}
	}

	/**
	 * Register a reader from newsletter signup.
	 *
	 * @param string $provider The provider name.
	 * @param array  $contact  {
	 *    Contact information.
	 *
	 *    @type string   $email    Contact email address.
	 *    @type string   $name     Contact name. Optional.
	 *    @type string[] $metadata Contact additional metadata. Optional.
	 * }
	 */
	public static function register_newsletters_contact( $provider, $contact ) {
		// Bail if already logged in.
		if ( \is_user_logged_in() ) {
			return;
		}

		Reader_Activation::register_reader(
			$contact['email'],
			isset( $contact['name'] ) ? $contact['name'] : ''
		);
	}

	/**
	 * Update content metadata after a contact's lists are updated.
	 *
	 * @param string        $provider        The provider name.
	 * @param string        $email           Contact email address.
	 * @param string[]      $lists_to_add    Array of list IDs to subscribe the contact to.
	 * @param string[]      $lists_to_remove Array of list IDs to remove the contact from.
	 * @param bool|WP_Error $result          True if the contact was updated or error if failed.
	 */
	public static function newspack_newsletters_update_contact_lists( $provider, $email, $lists_to_add, $lists_to_remove, $result ) {
		switch ( $provider ) {
			case 'active_campaign':
				if ( true === $result && method_exists( '\Newspack_Newsletters_Subscription', 'add_contact' ) && method_exists( '\Newspack_Newsletters_Subscription', 'get_contact_lists' ) ) {
					$current_lists = \Newspack_Newsletters_Subscription::get_contact_lists( $email );
					// The add_contact method is idempotent, effectively being an upsertion.
					\Newspack_Newsletters_Subscription::add_contact( [ 'email' => $email ], $current_lists );
				}
				break;
		}
	}

	/**
	 * Modify metadata for newsletter contact creation.
	 *
	 * @param string   $provider The provider name.
	 * @param array    $contact  {
	 *    Contact information.
	 *
	 *    @type string   $email    Contact email address.
	 *    @type string   $name     Contact name. Optional.
	 *    @type string[] $metadata Contact additional metadata. Optional.
	 * }
	 * @param string[] $selected_list_ids    Array of list IDs to subscribe the contact to.
	 */
	public static function newspack_newsletters_contact_data( $provider, $contact, $selected_list_ids ) {
		switch ( $provider ) {
			case 'active_campaign':
				$metadata = [];
				if ( is_user_logged_in() ) {
					$metadata['NP_Account'] = get_current_user_id();
				}

				// If it's a new contact, add a registration or signup date.
				$is_new_contact = null;
				try {
					if ( method_exists( '\Newspack_Newsletters_Subscription', 'get_contact_data' ) ) {
						$existing_contact = \Newspack_Newsletters_Subscription::get_contact_data( $contact['email'] );
						if ( is_wp_error( $existing_contact ) ) {
							Logger::log( 'Adding metadata to a new contact.' );
							$is_new_contact = true;
							if ( empty( $selected_list_ids ) ) {
								// Registration only, as a side effect of Reader Activation.
								$contact['metadata']['NP_Registration Date'] = gmdate( 'm/d/Y' );
							} else {
								// Registration and signup, the former implicit.
								$contact['metadata']['NP_Newsletter Signup Date'] = gmdate( 'm/d/Y' );
							}
						} else {
							Logger::log( 'Adding metadata to an existing contact.' );
							$is_new_contact = false;
						}
					}
				} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
					// Move along.
				}

				// Translate list IDs to list names and store as metadata.
				try {
					if ( method_exists( '\Newspack_Newsletters_Subscription', 'get_lists' ) ) {
						$lists = \Newspack_Newsletters_Subscription::get_lists();
						if ( ! is_wp_error( $lists ) ) {
							$lists_names = [];
							foreach ( $selected_list_ids as $selected_list_id ) {
								foreach ( $lists as $list ) {
									if ( $list['id'] === $selected_list_id ) {
										$lists_names[] = $list['name'];
									}
								}
							}
							// Note: this field will be overwritten every time it's updated.
							$metadata['NP_Newsletter Selection'] = implode( ', ', $lists_names );
						}
					}
				} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
					// Move along.
				}

				// If it's a new contact, add some context on the signup/registration.
				if ( $is_new_contact ) {
					$signup_page_url = isset( $contact['metadata'], $contact['metadata']['current_page_url'] ) ? $contact['metadata']['current_page_url'] : null;
					if ( $signup_page_url ) {
						// Rename this metadata field.
						$metadata['NP_Signup page'] = $signup_page_url;
						unset( $contact['metadata']['current_page_url'] );

						// Capture UTM params.
						$parsed_url = \wp_parse_url( $signup_page_url );
						if ( isset( $parsed_url['query'] ) ) {
							$url_params = array_reduce(
								explode( '&', $parsed_url['query'] ),
								function( $acc, $item ) {
									$parts            = explode( '=', $item );
									$acc[ $parts[0] ] = $parts[1];
									return $acc;
								},
								[]
							);
							foreach ( [ 'source', 'medium', 'campaign' ] as $value ) {
								$param = 'utm_' . $value;
								if ( isset( $url_params[ $param ] ) ) {
									$metadata[ 'NP_Signup UTM: ' . $value ] = sanitize_text_field( $url_params[ $param ] );
								}
							}
						}
					}
				}

				if ( isset( $contact['metadata'] ) ) {
					$contact['metadata'] = array_merge( $contact['metadata'], $metadata );
				} else {
					$contact['metadata'] = $metadata;
				}

				return $contact;
			default:
				return $contact;
		}
	}
}
Newspack_Newsletters::init();
