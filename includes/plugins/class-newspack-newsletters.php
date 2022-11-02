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
	const METADATA_DATE_FORMAT = 'Y-m-d';

	/**
	 * Metadata keys map for Reader Activation.
	 *
	 * @var array
	 */
	public static $metadata_keys = [
		'account'              => 'NP_Account',
		'registration_date'    => 'NP_Registration Date',
		'connected_account'    => 'NP_Connected Account',
		'signup_page'          => 'NP_Signup Page',
		'signup_page_utm'      => 'NP_Signup UTM: ',
		'newsletter_selection' => 'NP_Newsletter Selection',
		// Payment-related.
		'membership_status'    => 'NP_Membership Status',
		'payment_page'         => 'NP_Payment Page',
		'payment_page_utm'     => 'NP_Payment UTM: ',
		'sub_start_date'       => 'NP_Current Subscription Start Date',
		'sub_end_date'         => 'NP_Current Subscription End Date',
		'billing_cycle'        => 'NP_Billing Cycle',
		'recurring_payment'    => 'NP_Recurring Payment',
		'last_payment_date'    => 'NP_Last Payment Date',
		'last_payment_amount'  => 'NP_Last Payment Amount',
		'product_name'         => 'NP_Product Name',
		'next_payment_date'    => 'NP_Next Payment Date',
		'total_paid'           => 'NP_Total Paid',
	];

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( Reader_Activation::is_enabled() && Reader_Activation::get_setting( 'sync_esp' ) ) {
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
					$metadata[ self::$metadata_keys['account'] ] = get_current_user_id();
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
								$metadata[ self::$metadata_keys['newsletter_selection'] ] = implode( ', ', $lists_names );
							}
						}
					} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
						Logger::log( 'Error in getting contact lists: ' . $e->getMessage() );
						// Move along.
					}
				}

				$current_page_url = isset( $contact['metadata'], $contact['metadata']['current_page_url'] ) ? $contact['metadata']['current_page_url'] : null;
				if ( ! $current_page_url ) {
					global $wp;
					$current_page_url = home_url( add_query_arg( array(), $wp->request ) );
				}
				$current_page_url_params = self::get_url_params( $current_page_url );

				$is_new_contact = ! $contact['existing_contact_data'];
				// If the contact exists, but has no account metadata (or any metadata), treat it as a new contact.
				if ( $contact['existing_contact_data'] && ! isset( $contact['existing_contact_data']['metadata'], $contact['existing_contact_data']['metadata']['NP_ACCOUNT'] ) ) {
					$is_new_contact = true;
				}
				if ( $is_new_contact ) {
					$contact['metadata'][ self::$metadata_keys['registration_date'] ] = gmdate( self::METADATA_DATE_FORMAT );
					$metadata[ self::$metadata_keys['signup_page'] ]                  = $current_page_url;

					// Capture UTM params.
					foreach ( [ 'source', 'medium', 'campaign' ] as $value ) {
						$param = 'utm_' . $value;
						if ( isset( $current_page_url_params[ $param ] ) ) {
							$metadata[ self::$metadata_keys['signup_page_utm'] . $value ] = sanitize_text_field( $current_page_url_params[ $param ] );
						}
					}
				}

				// If the membership status is to be switched from recurring to non-recurring, ignore this change.
				if ( $contact['existing_contact_data'] && isset( $contact['metadata'][ self::$metadata_keys['membership_status'] ], $existing_metadata[ self::$metadata_keys['membership_status'] ] ) ) {
					$existing_metadata  = $contact['existing_contact_data']['metadata'];
					$becomes_once_donor = Stripe_Connection::ESP_METADATA_VALUES['once_donor'] === $contact['metadata'][ self::$metadata_keys['membership_status'] ];
					$is_recurring_donor = in_array(
						$existing_metadata[ self::$metadata_keys['membership_status'] ],
						[
							Stripe_Connection::ESP_METADATA_VALUES['monthly_donor'],
							Stripe_Connection::ESP_METADATA_VALUES['yearly_donor'],
						]
					);
					if ( $becomes_once_donor && $is_recurring_donor ) {
						unset( $contact['metadata'][ self::$metadata_keys['membership_status'] ] );
					}
				}

				if ( isset( $contact['metadata'] ) ) {
					if ( isset( $contact['metadata'][ self::$metadata_keys['last_payment_amount'] ] ) ) {
						$metadata[ self::$metadata_keys['payment_page'] ] = $current_page_url;
						foreach ( [ 'source', 'medium', 'campaign' ] as $value ) {
							$param = 'utm_' . $value;
							if ( isset( $current_page_url_params[ $param ] ) ) {
								$metadata[ self::$metadata_keys['payment_page_utm'] . $value ] = sanitize_text_field( $current_page_url_params[ $param ] );
							}
						}
					}

					if ( isset( $contact['metadata']['registration_method'] ) ) {
						$registration_method = $contact['metadata']['registration_method'];
						if ( in_array( $registration_method, Reader_Activation::SSO_REGISTRATION_METHODS ) ) {
							$contact['metadata'][ self::$metadata_keys['connected_account'] ] = $registration_method;
						}
					}
				}

				if ( isset( $contact['metadata'] ) && is_array( $contact['metadata'] ) ) {
					$contact['metadata'] = array_merge( $contact['metadata'], $metadata );
				} else {
					$contact['metadata'] = $metadata;
				}

				// Ensure only the prefixed metadata is passed along to the ESP.
				foreach ( $contact['metadata'] as $key => $value ) {
					if ( strpos( $key, 'NP_' ) !== 0 ) {
						unset( $contact['metadata'][ $key ] );
					}
				}

				return $contact;
			default:
				return $contact;
		}
	}

	/**
	 * Parse params from a URL.
	 *
	 * @param string $url URL to parse.
	 * @return array Associative array of params.
	 */
	private static function get_url_params( $url ) {
		$parsed_url = \wp_parse_url( $url );
		if ( isset( $parsed_url['query'] ) ) {
			return array_reduce(
				explode( '&', $parsed_url['query'] ),
				function( $acc, $item ) {
					$parts            = explode( '=', $item );
					$acc[ $parts[0] ] = count( $parts ) === 2 ? $parts[1] : '';
					return $acc;
				},
				[]
			);
		}
		return [];
	}

	/**
	 * Get lists without the master list, if set.
	 *
	 * @param int[] $list_ids List IDs to filter.
	 */
	public static function get_lists_without_active_campaign_master_list( $list_ids ) {
		$master_list_id = Reader_Activation::get_setting( 'active_campaign_master_list' );
		if ( is_int( intval( $master_list_id ) ) && is_array( $list_ids ) ) {
			return array_values( // Reset keys.
				array_filter(
					$list_ids,
					function( $id ) use ( $master_list_id ) {
						return $id !== $master_list_id;
					}
				)
			);
		}
		return $list_ids;
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
