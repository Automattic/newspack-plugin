<?php
/**
 * Data Events integration with RAS data library.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events;

defined( 'ABSPATH' ) || exit;

/**
 * RAS Data Class.
 */
final class RAS_Data {
	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'newspack_data_event_dispatch', [ __CLASS__, 'handle_dispatch' ], 10, 4 );
		\add_action( 'wp_footer', [ __CLASS__, 'print_dispatch' ], 100 );
	}

	/**
	 * Get actions that can be dispatched in the front-end for RAS.
	 *
	 * @return string[]
	 */
	private static function get_frontend_dispatch_actions() {
		$actions = [
			'reader_verified',
			'newsletter_subscribed',
			'newsletter_updated',
			'woocommerce_donation_order_processed',
			'woocommerce_order_failed',
			'donation_new',
			'donation_subscription_new',
			'campaign_interaction',
		];

		/**
		 * Filters the actions that can be dispatched in the front-end for RAS.
		 *
		 * @param string[] $actions The actions.
		 */
		return apply_filters( 'newspack_data_events_ras_frontend_dispatch_actions', $actions );
	}

	/**
	 * Get the transient key to temporarily store the events.
	 *
	 * @param string $client_id The client ID.
	 *
	 * @return string
	 */
	private static function get_transient_key( $client_id ) {
		return 'newspack_data_events_ras_' . $client_id;
	}

	/**
	 * Handle a data event dispatch.
	 *
	 * @param string $action    The action.
	 * @param int    $timestamp The timestamp.
	 * @param array  $data      The data.
	 * @param string $client_id The client ID.
	 */
	public static function handle_dispatch( $action, $timestamp, $data, $client_id ) {
		// Only dispatch if the action is allowed.
		if ( ! in_array( $action, self::get_frontend_dispatch_actions(), true ) ) {
			return;
		}

		// Only dispatch if the client is known.
		if ( ! $client_id ) {
			return;
		}

		$event = [
			'action'    => $action,
			'data'      => $data,
			'timestamp' => $timestamp * 1000, // RAS expects milliseconds.
		];

		/**
		 * Filter the event payload to be dispatched to RAS.
		 *
		 * @param array  $event     The event data.
		 * @param string $client_id The client ID.
		 */
		$event = apply_filters( 'newspack_data_events_ras_event', $event, $client_id );

		if ( empty( $event ) || \is_wp_error( $event ) ) {
			return;
		}

		$transient_key = self::get_transient_key( $client_id );
		$events        = get_transient( $transient_key ) ?? [];
		$events[]      = $event;
		set_transient( $transient_key, $events, 60 * 60 * 24 );
	}

	/**
	 * Print front-end dispatch.
	 */
	public static function print_dispatch() {
		$client_id = \Newspack\Reader_Activation::get_client_id();
		if ( ! $client_id ) {
			return;
		}
		$transient_key = self::get_transient_key( $client_id );
		$events        = get_transient( $transient_key );
		if ( empty( $events ) ) {
			return;
		}
		// Delete the transient.
		delete_transient( $transient_key );
		?>
		<script>
			( function() {
				var events = <?php echo wp_json_encode( $events ); ?>;
				if ( ! events.length ) {
					return;
				}
				var dataLayer = window.newspackRAS || [];
				for ( var i = 0; i < events.length; i++ ) {
					var event = events[ i ];
					dataLayer.push( event.action, event.data, event.timestamp );
				}
			} )();
		</script>
		<?php
	}
}
RAS_Data::init();
