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
			\add_action( 'newspack_newsletters_update_contact_lists', [ __CLASS__, 'update_contact_lists' ], 10, 5 );
			\add_filter( 'newspack_newsletters_contact_data', [ __CLASS__, 'contact_data' ], 10, 3 );
			\add_filter( 'newspack_newsletters_contact_lists', [ __CLASS__, 'add_activecampaign_master_list' ], 10, 3 );
		}
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
	public static function update_contact_lists( $provider, $email, $lists_to_add, $lists_to_remove, $result ) {
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
	 * @param array          $contact           {
	 *          Contact information.
	 *
	 *    @type string   $email                 Contact email address.
	 *    @type string   $name                  Contact name. Optional.
	 *    @type string   $existing_contact_data Existing contact data, if updating a contact. The hook will be also called when
	 *    @type string[] $metadata              Contact additional metadata. Optional.
	 * }
	 * @param string[]|false $selected_list_ids Array of list IDs the contact will be subscribed to, or false.
	 * @param string         $provider          The provider name.
	 */
	public static function contact_data( $contact, $selected_list_ids, $provider ) {
		switch ( $provider ) {
			case 'active_campaign':
				$metadata = [];
				if ( is_user_logged_in() ) {
					$metadata['NP_Account'] = get_current_user_id();
				}

				// Translate list IDs to list names and store as metadata, if lists are supplied.
				// The list ids can be an empty array, which means the contact has been unsubscribed from all lists.
				if ( false !== $selected_list_ids ) {
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
						Logger::log( 'Error in getting contact lists: ' . $e->getMessage() );
						// Move along.
					}
				}

				$signup_page_url = isset( $contact['metadata'], $contact['metadata']['current_page_url'] ) ? $contact['metadata']['current_page_url'] : null;
				if ( $signup_page_url ) {
					unset( $contact['metadata']['current_page_url'] );
				}

				$is_new_contact = ! $contact['existing_contact_data'];
				if ( $is_new_contact ) {
					if ( empty( $selected_list_ids ) ) {
						// Registration only, as a side effect of Reader Activation.
						$contact['metadata']['NP_Registration Date'] = gmdate( 'm/d/Y' );
					} else {
						// Registration and signup, the former implicit.
						$contact['metadata']['NP_Newsletter Signup Date'] = gmdate( 'm/d/Y' );
					}

					// Add some context on the signup/registration.
					if ( ! $signup_page_url ) {
						global $wp;
						$signup_page_url = home_url( add_query_arg( array(), $wp->request ) );
					}
					$metadata['NP_Signup page'] = $signup_page_url;

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

				if ( isset( $contact['metadata'] ) && is_array( $contact['metadata'] ) ) {
					$contact['metadata'] = array_merge( $contact['metadata'], $metadata );
				} else {
					$contact['metadata'] = $metadata;
				}

				return $contact;
			default:
				return $contact;
		}
	}

	/**
	 * Ensure the contact is always added to ActiveCampaign's selected master
	 * list.
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
