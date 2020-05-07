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

	/**
	 * Constructor
	 */
	public function __construct() {
		add_filter( 'googlesitekit_amp_gtag_opt', [ __CLASS__, 'inject_amp_events' ] );
		add_action( 'wp_footer', [ __CLASS__, 'inject_non_amp_events' ] );
	}

	/**
	 * Get data about all events.
	 *
	 * An event is largely based on the AMP analytics event spec and should contain the following fields:
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
				'event_name'     => '25%',
				'event_label'    => get_the_title(),
				'event_category' => 'NTG article milestone',
				'scrollSpec'     => [
					'verticalBoundaries' => [ 25 ],
				],
			],
			[
				'id'             => 'articleRead50',
				'on'             => 'scroll',
				'event_name'     => '50%',
				'event_label'    => get_the_title(),
				'event_category' => 'NTG article milestone',
				'scrollSpec'     => [
					'verticalBoundaries' => [ 50 ],
				],
			],
			[
				'id'             => 'articleRead100',
				'on'             => 'scroll',
				'event_name'     => '100%',
				'event_label'    => get_the_title(),
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
		foreach ( self::get_events() as $event ) {
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

			// Other integrations can use this filter if they need to modify the AMP-specific event config.
			$config['triggers'][ $event['id'] ] = apply_filters( 'newspack_analytics_amp_event_config', $event_config, $event );
		}

		return $config;
	}

	/**
	 * Inject event listeners on non-AMP pages.
	 */
	public static function inject_non_amp_events() {
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return;
		}

		$sitekit_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'google-site-kit' );
		if ( false && ! $sitekit_manager->is_module_active( 'analytics' ) ) {
			return;
		}

		foreach ( self::get_events() as $event ) {
			ob_start();
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

			// Other integrations can use this filter if they need to add a custom JS event handler.
			$event_js = apply_filters( 'newspack_analytics_event_js', ob_get_clean(), $event );
			echo $event_js; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
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
				const elements        = document.querySelectorAll( elementSelector );

				for ( const element of elements ) {
					element.addEventListener( 'click', function() {
						ga( 
							'send',
							'event',
							'<?php echo esc_attr( $event['event_category'] ); ?>',
							'<?php echo esc_attr( $event['event_name'] ); ?>',
							'<?php echo esc_attr( $event['event_label'] ); ?>'
						);
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

				var eventSent = false;
				window.addEventListener( 'scroll', function(){
					if ( eventSent ) {
						return;
					}

					const scrollPos = window.pageYOffset || window.scrollY;

					// @todo The max height and max scroll position are different values in my testing.
					// We need to resolve this because it's impossible to get 100% completed scrolling with current implementation.
					const documentHeight = document.body.clientHeight;

					if ( ( ( scrollPos / documentHeight ) * 100 ) >= scrollPercent ) {
						eventSent = true;
						ga( 
							'send',
							'event',
							'<?php echo esc_attr( $event['event_category'] ); ?>',
							'<?php echo esc_attr( $event['event_label'] ); ?>',
							'<?php echo esc_attr( $event['event_name'] ); ?>',
							scrollPercent
						);
					}
				} );
			} )();
		</script>
		<?php
	}
}
new Analytics();
