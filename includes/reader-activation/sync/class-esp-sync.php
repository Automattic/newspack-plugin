<?php
/**
 * Reader contact data syncing with the connected ESP using Newspack Newsletters.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * ESP Sync Class.
 */
class ESP_Sync extends Sync {
	/**
	 * Hook name for sync events.
	 */
	const SYNC_EVENT_HOOK = 'newspack_scheduled_esp_sync';

	/**
	 * User meta field prefix for contact data.
	 */
	const USER_META_PREFIX = 'newspack_sync_';

	/**
	 * The standard number of seconds to wait before syncing a contact to the ESP.
	 * If multiple sync requests happen within this timeframe, the request data will be consolidated and synced all at once.
	 * It's a unique number so that we can schedule one-off syncs outside of the regular sync method.
	 */
	const STANDARD_SYNC_DELAY = 123;

	/**
	 * Context of the sync.
	 *
	 * @var string
	 */
	protected static $context = 'ESP Sync';
	/**
	 * Initialize hooks.
	 */
	public static function init_hooks() {
		add_action( self::SYNC_EVENT_HOOK, [ __CLASS__, 'scheduled_sync' ], 10, 2 );
	}

	/**
	 * Whether contacts can be synced to the ESP.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	public static function can_esp_sync( $return_errors = false ) {
		$errors = new \WP_Error();

		if ( defined( 'NEWSPACK_FORCE_ALLOW_ESP_SYNC' ) && NEWSPACK_FORCE_ALLOW_ESP_SYNC ) {
			return $return_errors ? $errors : true;
		}

		$can_sync = static::can_sync( true );
		if ( $can_sync->has_errors() ) {
			$can_sync->export_to( $errors );
		}

		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
			$errors->add(
				'newspack_newsletters_contacts_not_found',
				__( 'Newspack Newsletters is not available.', 'newspack-plugin' )
			);
		}

		if ( ! Reader_Activation::get_setting( 'sync_esp' ) ) {
			$errors->add(
				'ras_esp_sync_not_enabled',
				__( 'ESP sync is not enabled.', 'newspack-plugin' )
			);
		}

		if ( ! Reader_Activation::get_esp_master_list_id() ) {
			$errors->add(
				'ras_esp_master_list_id_not_found',
				__( 'ESP master list ID is not set.', 'newspack-plugin' )
			);
		}

		if ( $return_errors ) {
			return $errors;
		}

		if ( $errors->has_errors() ) {
			return false;
		}

		return true;
	}

	/**
	 * Reconcile contact data for a user with data stored in user meta.
	 *
	 * @param int   $user_id The user ID.
	 * @param array $contact The new contact data.
	 */
	public static function reconcile_contact_data( $user_id, $contact ) {
		$existing_contact = \get_user_meta( $user_id, self::USER_META_PREFIX . 'contact', true );

		// Merge existing contact data with new data and update in user meta.
		if ( ! empty( $existing_contact['metadata'] ) ) {
			$contact['metadata'] = \wp_parse_args( $contact['metadata'], $existing_contact['metadata'] );
			$contact             = \wp_parse_args( $contact, $existing_contact );
		}

		return $contact;
	}

	/**
	 * Queue a request to sync a contact to the ESP.
	 *
	 * @param array  $contact The contact data to sync.
	 * @param string $context The context of the sync. Defaults to static::$context.
	 * @param int    $delay   The number of seconds to wait before syncing.
	 *
	 * @return true|\WP_Error True if succeeded or WP_Error.
	 */
	public static function sync( $contact, $context = '', $delay = null ) {
		$can_sync = static::can_esp_sync( true );
		if ( $can_sync->has_errors() ) {
			return $can_sync;
		}

		if ( empty( $context ) ) {
			$context = static::$context;
		}

		if ( ! is_int( $delay ) ) {
			$delay = self::STANDARD_SYNC_DELAY;
		}

		/**
		 * Filters the contact data before normalizing for syncing to the ESP.
		 *
		 * @param array  $contact The contact data to sync.
		 * @param string $context The context of the sync.
		 */
		$contact = \apply_filters( 'newspack_esp_presync_contact', $contact, $context );
		$contact = Sync\Metadata::normalize_contact_data( $contact );

		$user    = \get_user_by( 'email', $contact['email'] );
		$contact = self::reconcile_contact_data( $user->ID, $contact );

		// Merge existing contexts with new context and update in user meta.
		$existing_context = \get_user_meta( $user->ID, self::USER_META_PREFIX . 'context', true );
		if ( empty( $existing_context ) ) {
			$existing_context = [];
		}
		$existing_context[] = $context;

		\update_user_meta( $user->ID, self::USER_META_PREFIX . 'contact', $contact );
		\update_user_meta( $user->ID, self::USER_META_PREFIX . 'context', $existing_context );

		// If there's an unprocessed sync event for this user, cancel it.
		$cleared = \wp_clear_scheduled_hook( self::SYNC_EVENT_HOOK, [ $user->ID ] );
		if ( ! empty( $cleared ) ) {
			static::log(
				__( 'Scheduled sync cancelled due to debounce', 'newspack-plugin' ),
				[
					'cancelled'    => $cleared,
					'contact'      => $contact,
					'new_context'  => $context,
					'all_contexts' => $existing_context,
					'user_id'      => $user->ID,
				]
			);
		}

		// Execute sync immediately or schedule it.
		if ( 0 === $delay ) {
			return self::execute_sync( $user->ID, $context );
		}
		return self::schedule_sync( $user->ID, $delay, $context );
	}

	/**
	 * Execute a sync request with the connected ESP.
	 *
	 * @param int    $user_id The user ID for the contact to sync.
	 * @param string $context The context of the sync.
	 */
	public static function execute_sync( $user_id, $context = '' ) {
		$can_sync = static::can_esp_sync( true );
		if ( $can_sync->has_errors() ) {
			return $can_sync;
		}

		$contact = Sync\WooCommerce::get_contact_from_customer( new \WC_Customer( $user_id ) );

		/**
		 * Filters the contact data before normalizing for syncing to the ESP.
		 *
		 * @param array  $contact The contact data to sync.
		 * @param string $context The context of the sync.
		 */
		$contact = \apply_filters( 'newspack_esp_sync_contact', $contact, $context );
		$contact = Sync\Metadata::normalize_contact_data( $contact );
		$contact = self::reconcile_contact_data( $user_id, $contact );

		if ( empty( $context ) ) {
			$stored_context = \get_user_meta( $user_id, self::USER_META_PREFIX . 'context', true );
			if ( ! empty( $stored_context ) ) {
				$context = end( $stored_context );
			}
		}

		if ( empty( $context ) ) {
			$context = static::$context;
		}

		$master_list_id = Reader_Activation::get_esp_master_list_id();

		$result = \Newspack_Newsletters_Contacts::upsert( $contact, $master_list_id, $context );
		if ( ! \is_wp_error( $result ) ) {
			\delete_user_meta( $user_id, self::USER_META_PREFIX . 'context' );
		}

		return \is_wp_error( $result ) ? $result : true;
	}

	/**
	 * Schedule a future sync.
	 *
	 * @param int    $user_id The user ID for the contact to sync.
	 * @param int    $delay   The delay in seconds.
	 * @param string $context The context of the sync.
	 *
	 * @return bool|\WP_Error True if the sync was scheduled, WP_Error otherwise.
	 */
	public static function schedule_sync( $user_id, $delay, $context = '' ) {
		// Schedule another sync in $delay number of seconds.
		if ( ! is_int( $delay ) ) {
			return false;
		}

		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return false;
		}

		static::log(
			__( 'Scheduling ESP sync for user', 'newspack-plugin' ),
			[
				'user_email' => $user->data->user_email,
				'user_id'    => $user_id,
				'context'    => $context,
			]
		);
		return \wp_schedule_single_event( \time() + $delay, self::SYNC_EVENT_HOOK, [ $user_id ], true );
	}

	/**
	 * Handle a scheduled sync event.
	 *
	 * @param int $user_id The user ID for the contact to sync.
	 */
	public static function scheduled_sync( $user_id ) {
		self::execute_sync( $user_id );
	}

	/**
	 * Given a user ID or WooCommerce Order, sync that reader's contact data to
	 * the connected ESP.
	 *
	 * @param int|\WC_order $user_id_or_order User ID or WC_Order object.
	 * @param bool          $is_dry_run       True if a dry run.
	 *
	 * @return true|\WP_Error True if the contact was synced successfully, WP_Error otherwise.
	 */
	public static function sync_contact( $user_id_or_order, $is_dry_run = false ) {
		$can_sync = static::can_esp_sync( true );
		if ( ! $is_dry_run && $can_sync->has_errors() ) {
			return $can_sync;
		}

		$is_order = $user_id_or_order instanceof \WC_Order;
		$order    = $is_order ? $user_id_or_order : false;
		$user_id  = $is_order ? $order->get_customer_id() : $user_id_or_order;
		$user     = \get_userdata( $user_id );

		$customer = new \WC_Customer( $user_id );
		if ( ! $customer || ! $customer->get_id() ) {
			return new \WP_Error(
				'newspack_esp_sync_contact',
				sprintf(
				// Translators: %d is the user ID.
					__( 'Customer with ID %d does not exist.', 'newspack-plugin' ),
					$user_id
				)
			);
		}

		// Ensure the customer has a billing address.
		if ( ! $customer->get_billing_email() && $customer->get_email() ) {
			$customer->set_billing_email( $customer->get_email() );
			$customer->save();
		}

		$contact = $is_order ? Sync\WooCommerce::get_contact_from_order( $order ) : Sync\WooCommerce::get_contact_from_customer( $customer );
		$result  = $is_dry_run ? true : self::sync( $contact, '', 0 );

		if ( $result && ! \is_wp_error( $result ) ) {
			static::log(
				sprintf(
					// Translators: %1$s is the status and %2$s is the contact's email address.
					__( '%1$s contact data for %2$s.', 'newspack-plugin' ),
					$is_dry_run ? __( 'Would sync', 'newspack-plugin' ) : __( 'Synced', 'newspack-plugin' ),
					$customer->get_email()
				)
			);
			if ( ! empty( static::$results ) ) {
				static::$results['processed']++;
			}
		}

		return $result;
	}
}
ESP_Sync::init_hooks();
