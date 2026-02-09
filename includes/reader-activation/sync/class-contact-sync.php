<?php
/**
 * Reader contact data syncing with the active integrations.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Integrations;
use Newspack\Data_Events;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Contact Sync Class.
 */
class Contact_Sync extends Sync {
	/**
	 * Context of the sync.
	 *
	 * @var string
	 */
	protected static $context = 'Contact Sync';

	/**
	 * Queued syncs containing their contexts keyed by email address.
	 *
	 * @var array[]
	 */
	protected static $queued_syncs = [];

	/**
	 * Data Events action for per-integration contact sync.
	 */
	const SYNC_INTEGRATION_ACTION = 'esp_sync_integration';

	/**
	 * Initialize hooks.
	 */
	public static function init_hooks() {
		add_action( 'newspack_scheduled_esp_sync', [ __CLASS__, 'scheduled_sync' ], 10, 2 );
		add_action( 'shutdown', [ __CLASS__, 'run_queued_syncs' ] );
		self::register_data_events();
	}

	/**
	 * Register the per-integration sync action and handler with Data Events.
	 */
	private static function register_data_events() {
		Data_Events::register_action( self::SYNC_INTEGRATION_ACTION );
		Data_Events::register_handler( [ __CLASS__, 'handle_integration_sync' ], self::SYNC_INTEGRATION_ACTION );
	}

	/**
	 * Sync contact to the ESP.
	 *
	 * During data event handler execution, dispatches a separate data event
	 * per active integration. Each per-integration event is handled
	 * independently by Data Events, which provides handler-level retry with
	 * exponential backoff if a push fails.
	 *
	 * Outside data events, uses the in-memory queue for batch execution on shutdown.
	 *
	 * @param array  $contact          The contact data to sync.
	 * @param string $context          The context of the sync. Defaults to static::$context.
	 * @param array  $existing_contact Optional. Existing contact data to merge with. Defaults to null.
	 *
	 * @return true|\WP_Error True if succeeded or WP_Error.
	 */
	public static function sync( $contact, $context = '', $existing_contact = null ) {
		$can_sync = static::can_sync( true );
		if ( $can_sync->has_errors() ) {
			return $can_sync;
		}

		if ( empty( $context ) ) {
			$context = static::$context;
		}

		// During data event handler execution, dispatch a separate event per
		// integration so each can be independently retried by Data Events.
		if ( Data_Events::current_event() && ! did_action( 'shutdown' ) ) {
			return self::dispatch_integration_syncs( $contact, $context, $existing_contact );
		}

		// Outside data event context: in-memory queue + shutdown execution.
		if ( ! isset( self::$queued_syncs[ $contact['email'] ] ) ) {
			self::$queued_syncs[ $contact['email'] ] = [
				'contexts' => [],
				'contact'  => [],
			];
		}
		if ( ! empty( self::$queued_syncs[ $contact['email'] ]['contact']['metadata'] ) ) {
			$contact['metadata'] = array_merge( self::$queued_syncs[ $contact['email'] ]['contact']['metadata'], $contact['metadata'] );
		}
		self::$queued_syncs[ $contact['email'] ]['contexts'][] = $context;
		self::$queued_syncs[ $contact['email'] ]['contact']    = $contact;

		// If shutdown hasn't happened yet, defer execution.
		if ( ! did_action( 'shutdown' ) ) {
			return;
		}

		return self::push_to_integrations( $contact, $context, $existing_contact );
	}

	/**
	 * Dispatch a per-integration sync event for each active integration.
	 *
	 * Each integration gets its own Data Events dispatch so it can be
	 * independently processed and retried by the handler retry mechanism.
	 *
	 * @param array  $contact          The contact data to sync.
	 * @param string $context          The context of the sync.
	 * @param array  $existing_contact Optional. Existing contact data to merge with.
	 *
	 * @return true
	 */
	private static function dispatch_integration_syncs( $contact, $context, $existing_contact = null ) {
		$integrations = Integrations::get_active_integrations();
		foreach ( $integrations as $integration_id => $integration ) {
			Data_Events::dispatch(
				self::SYNC_INTEGRATION_ACTION,
				[
					'integration_id'   => $integration_id,
					'contact'          => $contact,
					'context'          => $context,
					'existing_contact' => $existing_contact,
				]
			);
		}
		return true;
	}

	/**
	 * Handle a per-integration sync event from Data Events.
	 *
	 * Pushes contact data to a single integration. Throws on failure so the
	 * Data Events handler retry mechanism can schedule a retry.
	 *
	 * @param int    $timestamp Event timestamp.
	 * @param array  $data      Event data containing integration_id, contact, context, existing_contact.
	 * @param string $client_id Client ID.
	 *
	 * @throws \RuntimeException When the integration push fails.
	 */
	public static function handle_integration_sync( $timestamp, $data, $client_id ) {
		$integration_id   = $data['integration_id'] ?? null;
		$contact          = $data['contact'] ?? null;
		$context          = $data['context'] ?? static::$context;
		$existing_contact = $data['existing_contact'] ?? null;

		if ( ! $integration_id || ! $contact ) {
			throw new \RuntimeException( 'Missing integration_id or contact in esp_sync_integration event data.' );
		}

		$integration = Integrations::get_integration( $integration_id );
		if ( ! $integration ) {
			throw new \RuntimeException( sprintf( 'Integration "%s" not found.', sanitize_text_field( $integration_id ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
		}

		/** This filter is documented in includes/reader-activation/sync/class-esp-sync.php */
		$contact = \apply_filters( 'newspack_esp_sync_contact', $contact, $context );
		$contact = Sync\Metadata::normalize_contact_data( $contact );

		$result = $integration->push_contact_data( $contact, $context, $existing_contact );
		if ( \is_wp_error( $result ) ) {
			$error_message = sprintf(
				'Integration "%s" sync failed for %s: %s',
				sanitize_text_field( $integration_id ),
				sanitize_email( $contact['email'] ?? 'unknown' ),
				esc_html( $result->get_error_message() )
			);
			throw new \RuntimeException( $error_message ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
		}
	}

	/**
	 * Push contact data to all active integrations.
	 *
	 * Used outside data event context (shutdown queue, WP-CLI, manual calls).
	 *
	 * @param array  $contact          The contact data to sync.
	 * @param string $context          The context of the sync.
	 * @param array  $existing_contact Optional. Existing contact data to merge with.
	 *
	 * @return true|\WP_Error True if all succeeded, or WP_Error with combined messages.
	 */
	private static function push_to_integrations( $contact, $context, $existing_contact = null ) {
		/** This filter is documented in includes/reader-activation/sync/class-esp-sync.php */
		$contact = \apply_filters( 'newspack_esp_sync_contact', $contact, $context );
		$contact = Sync\Metadata::normalize_contact_data( $contact );

		$integrations = Integrations::get_active_integrations();
		$errors       = [];

		foreach ( $integrations as $integration_id => $integration ) {
			$result = $integration->push_contact_data( $contact, $context, $existing_contact );
			if ( \is_wp_error( $result ) ) {
				$errors[] = sprintf( '[%s] %s', $integration_id, $result->get_error_message() );
			}
		}

		if ( ! empty( $errors ) ) {
			return new \WP_Error( 'newspack_esp_sync_failed', implode( '; ', $errors ) );
		}

		return true;
	}

	/**
	 * Schedule a future sync.
	 *
	 * @param int    $user_id The user ID for the contact to sync.
	 * @param string $context The context of the sync.
	 * @param int    $delay   The delay in seconds.
	 */
	public static function schedule_sync( $user_id, $context, $delay ) {
		// Schedule another sync in $delay number of seconds.
		if ( ! is_int( $delay ) ) {
			return;
		}

		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return;
		}

		static::log(
			sprintf(
				// Translators: %s is the email address of the contact to synced.
				__( 'Scheduling secondary sync for contact %s.', 'newspack-plugin' ),
				$user->data->user_email
			),
			[
				'user_email' => $user->data->user_email,
				'user_id'    => $user_id,
				'context'    => $context,
			]
		);
		\wp_schedule_single_event( \time() + $delay, 'newspack_scheduled_esp_sync', [ $user_id, $context ] );
	}

	/**
	 * Handle a scheduled sync event.
	 *
	 * @param int    $user_id The user ID for the contact to sync.
	 * @param string $context The context of the sync.
	 */
	public static function scheduled_sync( $user_id, $context ) {
		$contact = Sync\WooCommerce::get_contact_from_customer( new \WC_Customer( $user_id ) );
		if ( ! $contact ) {
			return;
		}
		self::sync( $contact, $context );
	}

	/**
	 * Get contact data for syncing.
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return array|\WP_Error The contact data or WP_Error.
	 */
	public static function get_contact_data( $user_id ) {
		if ( ! class_exists( '\WC_Customer' ) ) {
			return new \WP_Error( 'newspack_esp_sync_contact', __( 'WC_Customer class unavailable.', 'newspack-plugin' ) );
		}
		$user = \get_userdata( $user_id );

		if ( ! class_exists( '\WC_Customer' ) ) {
			return new \WP_Error( 'newspack_esp_sync_contact', __( 'WC_Customer class unavailable.', 'newspack-plugin' ) );
		}
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

		$contact = Sync\WooCommerce::get_contact_from_customer( $customer );

		// Include data from queued syncs too.
		if ( ! empty( self::$queued_syncs[ $contact['email'] ]['contact']['metadata'] ) ) {
			$contact['metadata'] = array_merge( self::$queued_syncs[ $contact['email'] ]['contact']['metadata'], $contact['metadata'] );
		}

		return $contact;
	}

	/**
	 * Given a user ID or WooCommerce Order, sync that reader's contact data to
	 * the connected ESP.
	 *
	 * @param int|\WC_order $user_id_or_order User ID or WC_Order object.
	 * @param string        $context          The context of the sync.
	 * @param bool          $is_dry_run       True if a dry run.
	 *
	 * @return true|\WP_Error True if the contact was synced successfully, WP_Error otherwise.
	 */
	public static function sync_contact( $user_id_or_order, $context = '', $is_dry_run = false ) {
		$can_sync = static::can_sync( true );
		if ( ! $is_dry_run && $can_sync->has_errors() ) {
			return $can_sync;
		}

		$is_order = $user_id_or_order instanceof \WC_Order;
		$order    = $is_order ? $user_id_or_order : false;
		$user_id  = $is_order ? $order->get_customer_id() : $user_id_or_order;

		$contact = $is_order ? Sync\WooCommerce::get_contact_from_order( $order ) : self::get_contact_data( $user_id );
		$result  = $is_dry_run ? true : self::sync( $contact, $context );

		if ( $result && ! \is_wp_error( $result ) ) {
			static::log(
				sprintf(
					// Translators: %1$s is the status and %2$s is the contact's email address.
					__( '%1$s contact data for %2$s.', 'newspack-plugin' ),
					$is_dry_run ? __( 'Would sync', 'newspack-plugin' ) : __( 'Synced', 'newspack-plugin' ),
					$contact['email']
				)
			);
		}

		return $result;
	}

	/**
	 * Run queued syncs.
	 *
	 * @return void
	 */
	public static function run_queued_syncs() {
		if ( empty( self::$queued_syncs ) ) {
			return;
		}

		foreach ( self::$queued_syncs as $email => $queued_sync ) {
			$user = get_user_by( 'email', $email );
			$contact = null;
			if ( $user ) {
				// For existing users, get fresh contact data.
				$contact = self::get_contact_data( $user->ID );
			} else {
				// For deleted users, try to use the queued contact data directly; $user will return nothing.
				$contact = $queued_sync['contact'];
			}
			if ( ! $contact ) {
				continue;
			}
			$contexts = $queued_sync['contexts'];
			self::sync( $contact, implode( '; ', $contexts ) );
		}

		self::$queued_syncs = [];
	}
}
Contact_Sync::init_hooks();
