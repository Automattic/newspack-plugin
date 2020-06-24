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
		add_filter( 'render_block', [ __CLASS__, 'add_amp_visibility_wrapper' ], 10, 2 );
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
				'id'             => 'socialShareClickedWhatsApp',
				'on'             => 'click',
				'element'        => 'a.share-jetpack-whatsapp',
				'amp_element'    => 'amp-social-share[type="whatsapp"]',
				'event_name'     => 'social share',
				'event_label'    => 'whatsapp',
				'event_category' => 'NTG social',
			],
			[
				'id'             => 'socialShareClickedLinkedIn',
				'on'             => 'click',
				'element'        => 'a.share-linkedin',
				'amp_element'    => 'amp-social-share[type="linkedin"]',
				'event_name'     => 'social share',
				'event_label'    => 'linkedin',
				'event_category' => 'NTG social',
			],
			[
				'id'              => 'articleRead25',
				'on'              => 'scroll',
				'event_name'      => '25%',
				'event_value'     => 25,
				'event_label'     => get_the_title(),
				'event_category'  => 'NTG article milestone',
				'non_interaction' => true,
				'scrollSpec'      => [
					'verticalBoundaries' => [ 25 ],
				],
			],
			[
				'id'              => 'articleRead50',
				'on'              => 'scroll',
				'event_name'      => '50%',
				'event_value'     => 50,
				'event_label'     => get_the_title(),
				'event_category'  => 'NTG article milestone',
				'non_interaction' => true,
				'scrollSpec'      => [
					'verticalBoundaries' => [ 50 ],
				],
			],
			[
				'id'              => 'articleRead100',
				'on'              => 'scroll',
				'event_name'      => '100%',
				'event_value'     => 100,
				'event_label'     => get_the_title(),
				'event_category'  => 'NTG article milestone',
				'non_interaction' => true,
				'scrollSpec'      => [
					'verticalBoundaries' => [ 100 ],
				],
			],

			// Newsletters.
			[
				'id'              => 'newsletterImpressionContent',
				'on'              => 'visible',
				'element'         => '.entry-content > .newspack-visibility-wrapper',
				'event_name'      => 'newsletter modal impression 3', // 3: in-content prompt (not a campaign)
				'event_label'     => get_the_title(),
				'event_category'  => 'NTG newsletter',
				'non_interaction' => true,
				'visibilitySpec'  => [
					'totalTimeMin' => 500,
				],
			],
			[
				'id'             => 'newsletterSignup',
				'amp_on'         => 'amp-form-submit-success',
				'on'             => 'submit',
				'element'        => '.entry-content > .newspack-visibility-wrapper form',
				'event_name'     => 'newsletter signup',
				'event_label'    => 'success',
				'event_category' => 'NTG newsletter',
				'visibilitySpec' => [
					'totalTimeMin' => 500,
				],
			],
		];

		/**
		 * Other integrations can add events to track using this filter.
		 */
		return apply_filters( 'newspack_analytics_events', $events );
	}

	/**
	 * Filters block HTML content server-side.
	 * Lets us extend core/Jetpack blocks without breaking the editor experience.
	 * This filter callback adds an <amp-layout> wrapper element to the block HTML
	 * that can be used to track their visibility using the AMP visibility trigger.
	 *
	 * @param string $block_content The HTML for the block to be filtered.
	 * @param array  $block Block data for the block to be filtered.
	 * @return string Modified HTML for the block to be rendered.
	 */
	public static function add_amp_visibility_wrapper( $block_content, $block ) {
		$blocks_to_filter = [ 'jetpack/mailchimp' ];

		if ( ! in_array( $block['blockName'], $blocks_to_filter ) ) {
			return $block_content;
		}

		$id = 'newsletter-block-' . get_post_type();

		$filtered_content = '<amp-layout id="' . esc_attr( $id ) . '" class="newspack-visibility-wrapper">' . $block_content . '</amp-layout>';
		return $filtered_content;
	}

	/**
	 * Inject event listeners on AMP pages.
	 *
	 * @param array $config AMP Analytics config from Site Kit.
	 * @return array Modified $config.
	 */
	public static function inject_amp_events( $config ) {
		$events = self::get_events();

		foreach ( $events as $event ) {
			$event_config = [
				'on'      => isset( $event['amp_on'] ) ? $event['amp_on'] : $event['on'],
				'vars'    => [
					'event_name'     => $event['event_name'],
					'event_label'    => $event['event_label'],
					'event_category' => $event['event_category'],
					'non_interaction' => ! empty( $event['non_interaction'] ) ? $event['non_interaction'] : false,
				],
			];
			if ( isset( $event['event_value'] ) ) {
				$event_config['vars']['value'] = $event['event_value'];
			}

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

			if ( 'click' !== $event_config['on'] ) {
				/**
				 * This is how non-interactive events are added to amp-analytics.
				 *
				 * @see https://github.com/ampproject/amphtml/issues/5018#issuecomment-247402181
				 */
				$event_config['extraUrlParams'] = [
					'ni' => 1,
				];
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
		if ( ! $sitekit_manager->is_module_active( 'analytics' ) ) {
			return;
		}

		// Discard events with duplicate ids.
		$all_events   = self::get_events();
		$unique_array = [];
		foreach ( $all_events as $element ) {
			$hash                  = $element['id'];
			$unique_array[ $hash ] = $element;
		}

		foreach ( $unique_array as $event ) {
			ob_start();
			switch ( $event['on'] ) {
				case 'click':
					self::output_js_click_event( $event );
					break;
				case 'scroll':
					self::output_js_scroll_event( $event );
					break;
				case 'submit':
					self::output_js_submit_event( $event );
					break;
				case 'visible':
					self::output_js_visible_event( $event );
					break;
				case 'ini-load':
					self::output_js_ini_load_event( $event );
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
				var elementSelector = '<?php echo esc_attr( $event['element'] ); ?>';
				var elements        = Array.prototype.slice.call( document.querySelectorAll( elementSelector ) );

				for ( var i = 0; i < elements.length; ++i ) {
					elements[i].addEventListener( 'click', function() {
						gtag(
							'event',
							'<?php echo esc_attr( $event['event_name'] ); ?>',
							{
								event_category: '<?php echo esc_attr( $event['event_category'] ); ?>',
								event_label: '<?php echo esc_attr( $event['event_label'] ); ?>',
							}
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
				var scrollPercent = <?php echo (int) $event['scrollSpec']['verticalBoundaries'][0]; ?>;

				var eventSent = false;
				var reportEvent = function(){
					if ( eventSent ) {
						return;
					}

					var scrollPos = ( window.pageYOffset || window.scrollY ) + window.innerHeight;
					var documentHeight = document.body.clientHeight;

					if ( ( ( scrollPos / documentHeight ) * 100 ) >= scrollPercent ) {
						eventSent = true;
						gtag(
							'event',
							'<?php echo esc_attr( $event['event_name'] ); ?>',
							{
								event_category: '<?php echo esc_attr( $event['event_category'] ); ?>',
								event_label: '<?php echo esc_attr( $event['event_label'] ); ?>',
								value: scrollPercent,
								non_interaction: <?php echo esc_attr( ! empty( $event['non_interaction'] ) && true === $event['non_interaction'] ? 'true' : 'false' ); ?>,
							}
						);
					}
				}
				// Fire initially - page might be loaded with scroll offset.
				reportEvent()
				window.addEventListener( 'scroll', reportEvent );
			} )();
		</script>
		<?php
	}

	/**
	 * Output JS for a form submit-based event listener.
	 *
	 * @param array $event Event info. See 'get_events'.
	 */
	protected static function output_js_submit_event( $event ) {
		?>
		<script>
			( function() {
				var elementSelector = '<?php echo $event['element']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>';
				var elements        = Array.prototype.slice.call( document.querySelectorAll( elementSelector ) );

				for ( var i = 0; i < elements.length; ++i ) {
					elements[i].addEventListener( 'submit', function() {
						gtag(
							'event',
							'<?php echo esc_attr( $event['event_name'] ); ?>',
							{
								event_category: '<?php echo esc_attr( $event['event_category'] ); ?>',
								event_label: '<?php echo esc_attr( $event['event_label'] ); ?>',
							}
						);
					} );
				}
			} )();
		</script>
		<?php
	}

	/**
	 * Output JS for a form visibility-based event listener.
	 *
	 * @param array $event Event info. See 'get_events'.
	 */
	protected static function output_js_visible_event( $event ) {
		$delay = ! empty( $event['visibilitySpec'] ) && ! empty( $event['visibilitySpec']['totalTimeMin'] ) ? $event['visibilitySpec']['totalTimeMin'] : 0;
		?>
		<script>
			( function() {
				window.newspackViewedElements = window.newspackViewedElements || [];
				window.newspackCheckVisibility = window.newspackCheckVisibility || function( el ) {
					var elementHeight = el.offsetHeight;
					var elementWidth = el.offsetWidth;

					if ( elementHeight === 0 || elementWidth === 0 ) {
						return false;
					}

					var rect = el.getBoundingClientRect();

					return (
						rect.top >= -elementHeight &&
						rect.left >= -elementWidth &&
						rect.right <= ( window.innerWidth || document.documentElement.clientWidth ) + elementWidth &&
						rect.bottom <= ( window.innerHeight || document.documentElement.clientHeight ) + elementHeight
					)
				};

				var elementSelector = '<?php echo $event['element']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>';
				var elements        = Array.prototype.slice.call( document.querySelectorAll( elementSelector ) );

				var reportEvent = function() {
					for ( var i = 0; i < elements.length; ++i ) {
						var elementToCheck = elements[i];

						if ( window.newspackCheckVisibility( elementToCheck ) && -1 === window.newspackViewedElements.indexOf( elementToCheck ) ) {
							window.newspackViewedElements.push( elementToCheck );

							var totalTimeMin = window.setTimeout( function() {
								if ( window.newspackCheckVisibility( elementToCheck ) ) {
									console.log( 'reporting visible', elementToCheck );
									return gtag(
										'event',
										'<?php echo esc_attr( $event['event_name'] ); ?>',
										{
											event_category: '<?php echo esc_attr( $event['event_category'] ); ?>',
											event_label: '<?php echo esc_attr( $event['event_label'] ); ?>',
										}
									);
								}
								window.clearTimeout( totalTimeMin );
							}, <?php echo esc_attr( $delay ); ?> );
						}
					}
				};

				// Fire initially - page might be loaded with scroll offset.
				reportEvent();
				window.addEventListener( 'scroll', reportEvent );
			} )();
		</script>
		<?php
	}

	/**
	 * Output JS for a load event listener.
	 *
	 * @param array $event Event info. See 'get_events'.
	 */
	protected static function output_js_ini_load_event( $event ) {
		$element = isset( $event['element'] ) ? $event['element'] : '';
		?>
		<script>
			( function() {
				var handleEvent = function() {
					gtag(
						'event',
						'<?php echo esc_attr( $event['event_name'] ); ?>',
						{
							event_category: '<?php echo esc_attr( $event['event_category'] ); ?>',
							event_label: '<?php echo esc_attr( $event['event_label'] ); ?>',
							non_interaction: true,
						}
					);
				};

				var elementSelector = '<?php echo esc_attr( $element ); ?>';
				if (elementSelector) {
					var elements = Array.prototype.slice.call( document.querySelectorAll( elementSelector ) );
					for ( var i = 0; i < elements.length; ++i ) {

						var observer = new MutationObserver(function(mutations) {
							mutations.forEach(function(mutation) {
								if (
									mutation.attributeName === 'amp-access-hide' &&
									mutation.type == "attributes" &&
									! mutation.target.hasAttribute('amp-access-hide')
								) {
									handleEvent()
								}
							});
						});

						observer.observe(elements[i], { attributes: true });
					}
				} else {
					window.addEventListener('load', handleEvent)
				}
			} )();
		</script>
		<?php
	}
}
new Analytics();
