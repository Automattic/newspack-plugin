<?php
/**
 * Newspack Analytics features.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Manages Analytics integrations.
 */
class Analytics {

	const EVENTS_ENABLED_OPTION          = 'newspack_analytics_events_enabled';
	const EVENT_CATEGORY_DISABLED_OPTION = 'newspack_analytics_event_categories_disabled';

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', [ __CLASS__, 'register_events' ], 11 );
		add_filter( 'googlesitekit_amp_gtag_opt', [ __CLASS__, 'inject_amp_events' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'inject_non_amp_events' ] );
	}

	/**
	 * Return whether analytics events are enabled.
	 *
	 * @return bool
	 */
	public static function events_enabled() {
		return boolval( get_option( self::EVENTS_ENABLED_OPTION, true ) );
	}

	/**
	 * Disable analytics events.
	 */
	public static function disable_events() {
		update_option( self::EVENTS_ENABLED_OPTION, 0 );
	}

	/**
	 * Enable analytics events.
	 */
	public static function enable_events() {
		update_option( self::EVENTS_ENABLED_OPTION, 1 );
	}

	/**
	 * Disable analytics events for an event category.
	 *
	 * @param string $event_category The event category.
	 */
	public static function disable_event_category( $event_category ) {
		$saved_disabled = get_option( self::EVENT_CATEGORY_DISABLED_OPTION, [] );
		if ( in_array( $event_category, $saved_disabled ) ) {
			return;
		}

		$saved_disabled[] = $event_category;
		update_option( self::EVENT_CATEGORY_DISABLED_OPTION, $saved_disabled );
	}

	/**
	 * Enable analytics events for an event category.
	 *
	 * @param string $event_category The event category.
	 */
	public static function enable_event_category( $event_category ) {
		$saved_disabled = get_option( self::EVENT_CATEGORY_DISABLED_OPTION, [] );
		if ( in_array( $event_category, $saved_disabled ) ) {
			$index = array_search( $event_category, $saved_disabled );
			unset( $saved_disabled[ $index ] );
			update_option( self::EVENT_CATEGORY_DISABLED_OPTION, $saved_disabled );
		}
	}

	/**
	 * Return whether events for an event category are enabled.
	 *
	 * @param string $event_category The event category.
	 * @return bool Whether events are enabled for the category.
	 */
	public static function event_category_enabled( $event_category ) {
		$saved_disabled = get_option( self::EVENT_CATEGORY_DISABLED_OPTION, [] );
		return ! in_array( $event_category, $saved_disabled );
	}

	/**
	 * Get all known event categories and whether they should record events.
	 *
	 * @return array Array of 'name' and 'active' pairs.
	 */
	public static function get_event_categories() {
		$event_categories = [];
		foreach ( self::get_events() as $event ) {
			$event_categories[ $event['event_category'] ] = [
				'name'   => $event['event_category'],
				'active' => self::event_category_enabled( $event['event_category'] ),
			];
		}
		return $event_categories;
	}

	/**
	 * Get data about all events.
	 *
	 * An event should contain the following fields:
	 *    'id'             => string Event ID (e.g. "popupFormDisplayed").
	 *    'on'             => string Type of action (e.g. "click" or "form-submit-success").
	 *    'amp_on'         => string Type of action for AMP if different (e.g. "amp-form-submit-success").
	 *    'element'        => string CSS selector for element (e.g. '#popup1').
	 *    'amp_element'    => string CSS selector for AMP version of element if different.
	 *    'event_name'     => string Name for event in GA (e.g. 'Clicked').
	 *    'event_label'    => string Label for event in GA (e.g. 'Popup 1')
	 *    'event_category' => string Category for event in GA (e.g. 'Newspack Announcements').
	 * There can also be other fields specific for certain events (e.g. 'scrollSpec' for 'scroll' event listener).
	 */
	public static function get_events() {
		$events = [
			[
				'id'             => 'socialShareClickedFacebook',
				'on'             => 'click',
				'element'        => 'a.share-facebook',
				'amp_element'    => 'amp-social-share[type="facebook"]',
				'event_name'     => 'social share',
				'event_label'    => 'facebook',
				'event_category' => 'NTG social',
			],
			[
				'id'             => 'socialShareClickedTwitter',
				'on'             => 'click',
				'element'        => 'a.share-twitter',
				'amp_element'    => 'amp-social-share[type="twitter"]',
				'event_name'     => 'social share',
				'event_label'    => 'twitter',
				'event_category' => 'NTG social',
			],
			[
				'id'             => 'articleRead25',
				'on'             => 'scroll',
				'event_name'     => get_the_title(),
				'event_label'    => '25%',
				'event_category' => 'NTG article milestone',
				'scrollSpec'     => [
					'verticalBoundaries' => [ 25 ],
				],
			],
			[
				'id'             => 'articleRead50',
				'on'             => 'scroll',
				'event_name'     => get_the_title(),
				'event_label'    => '50%',
				'event_category' => 'NTG article milestone',
				'scrollSpec'     => [
					'verticalBoundaries' => [ 50 ],
				],
			],
			[
				'id'             => 'articleRead100',
				'on'             => 'scroll',
				'event_name'     => get_the_title(),
				'event_label'    => '100%',
				'event_category' => 'NTG article milestone',
				'scrollSpec'     => [
					'verticalBoundaries' => [ 100 ],
				],
			],
		];

		/**
		 * Other integrations can add events to track using this filter.
		 */
		return apply_filters( 'newspack_analytics_events', $events );
	}

	/**
	 * Inject event listeners on AMP pages.
	 *
	 * @param array $config AMP Analytics config from Site Kit.
	 * @return array Modified $config.
	 */
	public static function inject_amp_events( $config ) {
		$event_categories = self::get_event_categories();

		foreach ( self::get_events() as $event ) {
			if ( isset( $event_categories[ $event['event_category'] ] ) && ! $event_categories[ $event['event_category'] ]['active'] ) {
				continue;
			}

			$event_config = [
				'request' => 'event',
				'on'      => isset( $event['amp_on'] ) ? $event['amp_on'] : $event['on'],
				'vars'    => [
					'event_name'     => $event['event_name'],
					'event_label'    => $event['event_label'],
					'event_category' => $event['event_category'],
				],
			];

			if ( isset( $event['amp_element'] ) || isset( $event['element'] ) ) {
				$event_config['selector'] = isset( $event['amp_element'] ) ? $event['amp_element'] : $event['element'];
			}

			// Handle other config params e.g. 'scrollSpec'.
			foreach ( $event as $key => $val ) {
				if ( ! in_array( $key, [ 'id', 'on', 'amp_on', 'element', 'amp_element', 'event_name', 'event_label', 'event_category' ] ) ) {
					$event_config[ $key ] = $val;
				}
			}

			if ( ! isset( $config['triggers'] ) ) {
				$config['triggers'] = [];
			}

			$config['triggers'][ $event['id'] ] = $event_config;
		}

		return $config;
	}

	/**
	 * Inject event listeners on non-AMP pages.
	 */
	public static function inject_non_amp_events() {
		// @todo make sure Site Kit analytics is active here first.

		$event_categories = self::get_event_categories();

		foreach ( self::get_events() as $event ) {
			if ( isset( $event_categories[ $event['event_category'] ] ) && ! $event_categories[ $event['event_category'] ]['active'] ) {
				continue;
			}

			switch ( $event['on'] ) {
				case 'click':
					self::output_js_click_event( $event );
					break;
				case 'scroll':
					self::output_js_scroll_event( $event );
					break;
				default:
					break;
			}
		}
	}

	/**
	 * Output JS for a click-based event listener.
	 *
	 * @param array $event Event info. See 'get_events'.
	 */
	protected static function output_js_click_event( $event ) {
		?>
		<script>
			( function() {
				const elementSelector = '<?php echo esc_attr( $event['element'] ); ?>';
				const elements = document.querySelectorAll( elementSelector );

				for ( const element of elements ) {
					element.addEventListener( 'click', function() {
						<?php self::output_js_record_ga_event( $event ); ?>
					} );
				}
			} )();
		</script>
		<?php
	}

	/**
	 * Output JS for a scroll-based event listener.
	 *
	 * @param array $event Event info. See 'get_events'.
	 */
	protected static function output_js_scroll_event( $event ) {
		?>
		<script>
			( function() {
				const scrollPercent = <?php echo (int) $event['scrollSpec']['verticalBoundaries'][0]; ?>;

				// @todo throttle this event listener.
				window.addEventListener( 'scroll', function(){ console.log( window.scrollY ); 
					if ( ( ( window.scrollY / document.body.clientHeight ) * 100 ) > scrollPercent ) {
						<?php self::output_js_record_ga_event( $event ); ?>
					}
				} );
			} )();
		</script>
		<?php
	}

	/**
	 * Output JS GA function that records an event.
	 *
	 * @param array $event Event info. See 'get_events'.
	 */
	protected static function output_js_record_ga_event( $event ) {
		?>
		ga( 'send', 'event', '<?php echo esc_attr( $event['event_category'] ); ?>', '<?php echo esc_attr( $event['event_name'] ); ?>', '<?php echo esc_attr( $event['event_label'] ); ?>' );
		<?php
	}
}
new Analytics();
