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
	 * Events accumulated by block render callbacks.
	 *
	 * @var array
	 */
	public static $block_events = [];

	/**
	 * An integer to indicate the context a block is rendered in, e.g. content|overlay campaign|inline campaign.
	 *
	 * @var integer
	 */
	public static $block_render_context = 3;

	/**
	 * Constructor
	 */
	public function __construct() {
		add_filter( 'googlesitekit_amp_gtag_opt', [ __CLASS__, 'inject_amp_events' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'handle_custom_dimensions_reporting' ] );
		add_action( 'wp_footer', [ __CLASS__, 'inject_non_amp_events' ] );
		add_filter( 'render_block', [ __CLASS__, 'prepare_blocks_for_events' ], 10, 2 );
		add_action( 'newspack_campaigns_before_campaign_render', [ __CLASS__, 'set_campaign_render_context' ], 10, 1 );
		add_action( 'newspack_campaigns_after_campaign_render', [ __CLASS__, 'reset_render_context' ], 10, 1 );
		add_action( 'comment_form', [ __CLASS__, 'prepare_comment_events' ] );

		// WooCommerce hooks. https://docs.woocommerce.com/wc-apidocs/hook-docs.html.
		add_action( 'woocommerce_login_form_end', [ __CLASS__, 'prepare_login_events' ] );
		add_action( 'woocommerce_register_form_end', [ __CLASS__, 'prepare_registration_events' ] );
		add_action( 'woocommerce_after_checkout_registration_form', [ __CLASS__, 'prepare_checkout_registration_events' ] );
	}

	/**
	 * Tell Site Kit to report the article's data as custom dimensions.
	 * More about custom dimensions: https://support.google.com/analytics/answer/2709828.
	 */
	public static function handle_custom_dimensions_reporting() {
		$custom_dimensions = Analytics_Wizard::list_configured_custom_dimensions();
		foreach ( $custom_dimensions as $dimension ) {
			$dimension_role = $dimension['role'];
			// Remove `ga:` prefix.
			$dimension_id = substr( $dimension['id'], 3 );

			$post = get_post();
			if ( $post ) {
				if ( 'category' === $dimension_role ) {
					$categories = get_the_category();
					if ( ! empty( $categories ) ) {
						$categories_slugs = implode(
							',',
							array_map(
								function( $cat ) {
									return $cat->slug;
								},
								$categories
							)
						);
						self::add_custom_dimension_to_ga_config( $dimension_id, $categories_slugs );
					}
				}

				if ( 'author' === $dimension_role ) {
					$author_id = $post->post_author;
					self::add_custom_dimension_to_ga_config(
						$dimension_id,
						get_the_author_meta( 'display_name', $author_id )
					);
				}

				if ( 'word_count' === $dimension_role ) {
					self::add_custom_dimension_to_ga_config(
						$dimension_id,
						count( explode( ' ', wp_strip_all_tags( $post->post_content ) ) )
					);
				}

				if ( 'publish_date' === $dimension_role ) {
					self::add_custom_dimension_to_ga_config(
						$dimension_id,
						get_the_time( 'Y-m-d H:i', $post->ID )
					);
				}
			}
		}
	}

	/**
	 * Add custom dimension to GA config via Site Kit filters.
	 *
	 * @param string $dimension_id Dimension ID.
	 * @param string $payload Payload.
	 */
	public static function add_custom_dimension_to_ga_config( $dimension_id, $payload ) {
		// Non-AMP.
		add_filter(
			'googlesitekit_gtag_opt',
			function ( $gtag_opt ) use ( $payload, $dimension_id ) {
				$gtag_opt[ $dimension_id ] = $payload;
				return $gtag_opt;
			}
		);
		// AMP.
		add_filter(
			'googlesitekit_amp_gtag_opt',
			function ( $gtag_amp_opt ) use ( $payload, $dimension_id ) {
				$tracking_id = $gtag_amp_opt['vars']['gtag_id'];
				$gtag_amp_opt['vars']['config'][ $tracking_id ][ $dimension_id ] = $payload;
				return $gtag_amp_opt;
			}
		);
	}

	/**
	 * When a Newspack Campaign is being rendered, set the block rendering context based on whether campaign is inline or overlay.
	 *
	 * @param object $campaign The campaign object.
	 */
	public static function set_campaign_render_context( $campaign ) {
		$placement = isset( $campaign['options'], $campaign['options']['placement'] ) ? $campaign['options']['placement'] : null;
		switch ( $placement ) {
			case 'inline':
				self::$block_render_context = 1;
				break;
			default: // All other placement options are overlays.
				self::$block_render_context = 2;
				break;
		}
	}

	/**
	 * Reset rendering context after campaign rendering is complete.
	 *
	 * @param object $campaign The campaign object.
	 */
	public static function reset_render_context( $campaign ) {
		self::$block_render_context = 3;
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
		];

		if ( ! is_front_page() && ! is_archive() ) {
			$events = array_merge(
				$events,
				[
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
				]
			);
		}

		$custom_events = array_reduce(
			json_decode( get_option( Analytics_Wizard::$custom_events_option_name, '[]' ) ),
			function ( $all_custom_events, $event ) {
				$event = (array) $event;
				if ( $event['is_active'] ) {
					if ( 'submit' === $event['on'] ) {
						$event['amp_on'] = 'amp-form-submit-success';
					}
					if ( '' === $event['amp_element'] ) {
						unset( $event['amp_element'] );
					}
					$all_custom_events[] = $event;
				}
				return $all_custom_events;
			},
			[]
		);
		$events        = array_merge( $events, $custom_events );

		/**
		 * Other integrations can add events to track using this filter.
		 */
		return apply_filters( 'newspack_analytics_events', $events );
	}

	/**
	 * Alter block markup to support amp-analytics events.
	 *
	 * @param string $content The block content about to be appended.
	 * @param object $block The full block, including name and attributes.
	 */
	public static function prepare_blocks_for_events( $content, $block ) {
		if ( is_admin() ) {
			return $content;
		}

		switch ( $block['blockName'] ) {
			case 'jetpack/mailchimp':
				$content = self::prepare_jetpack_mailchimp_block( $content );
				break;
		}
		return $content;
	}

	/**
	 * Alter Jetpack Mailchimp block to support amp-analytics events.
	 *
	 * @param string $content The block content about to be appended.
	 */
	public static function prepare_jetpack_mailchimp_block( $content ) {
		$block_unique_id = sprintf( 'wp-block-jetpack-mailchimp-%s', uniqid() );

		// Wrap the block in amp-layout to enable visibility tracking. Sugggested here: https://github.com/ampproject/amphtml/issues/11678.
		$content = sprintf( '<amp-layout id="%s">%s</amp-layout>', $block_unique_id, $content );

		self::$block_events[] = [
			'id'             => 'newsletterSignup-' . $block_unique_id,
			'amp_on'         => 'amp-form-submit-success',
			'on'             => 'submit',
			'element'        => '#' . $block_unique_id . ' form',
			'event_name'     => 'newsletter signup',
			'event_label'    => 'success',
			'event_category' => 'NTG newsletter',
			'visibilitySpec' => [
				'totalTimeMin' => 500,
			],
		];
		self::$block_events[] = [
			'id'              => 'newsletterImpression-' . $block_unique_id,
			'on'              => 'visible',
			'element'         => '#' . $block_unique_id,
			'event_name'      => 'newsletter modal impression ' . self::$block_render_context,
			'event_label'     => get_the_title(),
			'event_category'  => 'NTG newsletter',
			'non_interaction' => true,
			'visibilitySpec'  => [
				'totalTimeMin' => 500,
			],
		];
		return $content;
	}

	/**
	 * Prepare event triggers on user commenting.
	 */
	public static function prepare_comment_events() {
		self::$block_events[] = [
			'id'             => 'addComment',
			'amp_on'         => 'amp-form-submit-success',
			'on'             => 'submit',
			'element'        => '#commentform',
			'event_name'     => 'comment added',
			'event_category' => 'NTG user',
			'event_label'    => get_the_title(),
		];
	}

	/**
	 * Add login event triggers for the WooCommerce My Account and Checkout pages.
	 */
	public static function prepare_login_events() {
		self::$block_events[] = [
			'id'             => 'loginSuccess',
			'amp-on'         => 'amp-form-submit-success',
			'on'             => 'submit',
			'element'        => '.woocommerce-form-login',
			'event_category' => 'NTG account',
			'event_name'     => 'login',
			'event_label'    => 'success',
		];
	}

	/**
	 * Add registration event triggers for the WooCommerce My Account page.
	 */
	public static function prepare_registration_events() {
		self::$block_events[] = [
			'id'             => 'registrationSuccess',
			'amp-on'         => 'amp-form-submit-success',
			'on'             => 'submit',
			'element'        => '.woocommerce-form-register',
			'event_category' => 'NTG account',
			'event_name'     => 'registration',
			'event_label'    => 'success',
		];
	}

	/**
	 * Add a registration event trigger for the WooCommerce Checkout page.
	 */
	public static function prepare_checkout_registration_events() {
		self::$block_events[] = [
			'id'             => 'registrationSuccess',
			'amp-on'         => 'amp-form-submit-success',
			'on'             => 'submit',
			'element'        => '.woocommerce-checkout',
			'event_category' => 'NTG account',
			'event_name'     => 'registration',
			'event_label'    => 'success',
		];
	}

	/**
	 * Inject event listeners on AMP pages.
	 *
	 * @param array $config AMP Analytics config from Site Kit.
	 * @return array Modified $config.
	 */
	public static function inject_amp_events( $config ) {
		if ( is_user_logged_in() ) {
			$config['vars']['user_id'] = get_current_user_id();
		}
		$all_events = array_merge( self::get_events(), self::$block_events );
		foreach ( $all_events as $event ) {
			$event_config = [
				'request' => 'event',
				'on'      => isset( $event['amp_on'] ) ? $event['amp_on'] : $event['on'],
				'vars'    => [
					'event_name'      => $event['event_name'],
					'event_label'     => $event['event_label'],
					'event_category'  => $event['event_category'],
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
		$all_events   = array_merge( self::get_events(), self::$block_events );
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
				var elementSelector = '<?php echo str_replace( '&quot;', '"', esc_attr( $event['element'] ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Allow quotes for CSS selectors validity. ?>';
				var elements        = Array.prototype.slice.call( document.querySelectorAll( elementSelector ) );

				for ( var i = 0; i < elements.length; ++i ) {
					elements[i].addEventListener( 'click', function( event ) {
						<?php // Ensure the clicked element still matches the selector. For example an aria attribue might've changed. ?>
						if (event.currentTarget.matches(elementSelector)) {
							gtag(
								'event',
								'<?php echo esc_attr( $event['event_name'] ); ?>',
								{
									event_category: '<?php echo esc_attr( $event['event_category'] ); ?>',
									event_label: '<?php echo esc_attr( $event['event_label'] ); ?>',
								}
							);
						};
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
						window.removeEventListener( 'scroll', reportEvent );
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
				window.addEventListener( 'DOMContentLoaded', reportEvent );
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
				var elementSelector = '<?php echo esc_attr( $event['element'] ); ?>';
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

						// Stop tracking scroll after visibility has been reported.
						if ( -1 !== window.newspackViewedElements.indexOf( elementToCheck ) ) {
							window.removeEventListener( 'scroll', reportEvent );
							return;
						}

						if ( window.newspackCheckVisibility( elementToCheck ) && -1 === window.newspackViewedElements.indexOf( elementToCheck ) ) {
							window.newspackViewedElements.push( elementToCheck );

							var totalTimeMin = window.setTimeout( function() {

								// If element is still in viewport after <?php echo esc_attr( $delay ); ?>ms
								if ( window.newspackCheckVisibility( elementToCheck ) ) {
									return gtag(
										'event',
										'<?php echo esc_attr( $event['event_name'] ); ?>',
										{
											event_category: '<?php echo esc_attr( $event['event_category'] ); ?>',
											event_label: '<?php echo esc_attr( $event['event_label'] ); ?>',
											non_interaction: <?php echo esc_attr( ! empty( $event['non_interaction'] ) && true === $event['non_interaction'] ? 'true' : 'false' ); ?>,
										}
									);
								}
								window.clearTimeout( totalTimeMin );
							}, <?php echo esc_attr( $delay ); ?> );
						}
					}
				};

				// Fire initially - page might be loaded with scroll offset.
				window.addEventListener( 'DOMContentLoaded', reportEvent );
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
							non_interaction: <?php echo esc_attr( ! empty( $event['non_interaction'] ) && true === $event['non_interaction'] ? 'true' : 'false' ); ?>,
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
