<?php
/**
 * PWA management.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error, \WP_Service_Worker_Caching_Routes;

defined( 'ABSPATH' ) || exit;

/**
 * Manages settings for PWA.
 */
class PWA {

	const NEWSPACK_PUSH_NOTIFICATIONS = 'newspack_push_notifications';

	/**
	 * Add hooks.
	 */
	public static function init() {
		add_action( 'wp_front_service_worker', [ __CLASS__, 'register_caching_routes' ] );
		add_filter( 'wp_service_worker_navigation_caching_strategy', [ __CLASS__, 'caching_strategy' ] );
		add_filter( 'wp_service_worker_navigation_caching_strategy_args', [ __CLASS__, 'caching_strategy_args' ] );
		add_action( 'init', [ __CLASS__, 'render_push_notification_urls' ] );
		add_filter( 'the_content', [ __CLASS__, 'push_notifications' ] );
	}

	/**
	 * Check whether everything is configured correctly.
	 *
	 * @return bool|WP_Error True on success, WP_Error on failure.
	 */
	public static function check_configured() {
		if ( ! is_ssl() ) {
			return new WP_Error( 'newspack_pwa_error', __( 'Site is not served over https. Progressive web app features will not work.', 'newspack' ) );
		}

		if ( ! self::get_site_icon() ) {
			return new WP_Error( 'newspack_pwa_error', __( 'No site icon specified. Visitors will not be able to install the site as an app.', 'newspack' ) );
		}

		return true;
	}

	/**
	 * Retrieve Site Icon.
	 *
	 * @return null|array
	 */
	public static function get_site_icon() {
		$site_icon = get_option( 'site_icon' );
		if ( ! $site_icon ) {
			return null;
		}
		$url = wp_get_attachment_image_src( $site_icon );
		return [
			'id'  => $site_icon,
			'url' => $url[0],
		];
	}

	/**
	 * Update Site Icon
	 *
	 * @param string $site_icon The site icon.
	 */
	public function update_site_icon( $site_icon ) {
		if ( ! empty( $site_icon['id'] ) ) {
			update_option( 'site_icon', intval( $site_icon['id'] ) );
		} else {
			delete_option( 'site_icon' );
		}
	}

	/**
	 * Cache images for offline use.
	 *
	 * @param object $scripts PWA scripts object.
	 */
	public static function register_caching_routes( $scripts ) {
		// Cache images.
		$scripts->caching_routes()->register(
			'.*\.(?:png|gif|jpg|jpeg|svg|webp)(\?.*)?$', // @todo make sure this isn't caching Photon pixel.
			[
				'strategy'  => WP_Service_Worker_Caching_Routes::STRATEGY_NETWORK_FIRST,
				'cacheName' => 'images',
				'plugins'   => [
					'expiration' => [
						'maxEntries'    => 60,
						'maxAgeSeconds' => 60 * 60 * 24,
					],
				],
			]
		);

		// Cache theme assets.
		$theme_directory_uri_patterns = [
			preg_quote( trailingslashit( get_template_directory_uri() ), '/' ),
		];
		if ( get_template() !== get_stylesheet() ) {
			$theme_directory_uri_patterns[] = preg_quote( trailingslashit( get_stylesheet_directory_uri() ), '/' );
		}
		$scripts->caching_routes()->register(
			'^(' . implode( '|', $theme_directory_uri_patterns ) . ').*',
			[
				'strategy'  => WP_Service_Worker_Caching_Routes::STRATEGY_NETWORK_FIRST,
				'cacheName' => 'theme-assets',
				'plugins'   => [
					'expiration' => [
						'maxEntries' => 25,
					],
				],
			]
		);
	}

	/**
	 * Use network-first caching strategy.
	 *
	 * @param string $strategy Caching strategy.
	 * @return string caching strategy
	 */
	public static function caching_strategy( $strategy ) {
		return WP_Service_Worker_Caching_Routes::STRATEGY_NETWORK_FIRST;
	}

	/**
	 * Cache pages for offline use.
	 *
	 * @param array $args Caching strategy args.
	 * @return array $args
	 */
	public static function caching_strategy_args( $args ) {
		$args['cacheName']                           = 'pages';
		$args['plugins']['expiration']['maxEntries'] = 50;
		return $args;
	}

	/**
	 * Render Push Notification required HTML files.
	 */
	public static function render_push_notification_urls() {
		if ( ! get_option( self::NEWSPACK_PUSH_NOTIFICATIONS, false ) ) {
			return;
		}
		if ( isset( $_SERVER['REQUEST_URI'] ) ) { // WPCS: Input var okay.
			$raw_uri = sanitize_text_field(
				wp_unslash( $_SERVER['REQUEST_URI'] ) // WPCS: Input var okay.
			);
		} else {
			$raw_uri = '';
		}
		$path = null;
		switch ( $raw_uri ) {
			case '/helper-iframe.html':
				$path = dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/raw/amp-web-push-helper-frame.html';
				break;
			case '/permission-dialog.html':
				$path = dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/raw/amp-web-push-permission-dialog.html';
				break;
		}
		if ( $path ) {
			echo file_get_contents( $path ); // phpcs:ignore
			exit;
		}
	}

	/**
	 * Insert Push Notifications component
	 *
	 * @param string $content The content of the post.
	 * @return string The content with popup inserted.
	 */
	public static function push_notifications( $content = '' ) {
		if ( get_option( self::NEWSPACK_PUSH_NOTIFICATIONS, false ) ) {
			$base = get_site_url();
			ob_start();
			?>
			<amp-web-push
				id="amp-web-push"
				layout="nodisplay"
				helper-iframe-url="<?php echo esc_url( $base ); ?>/helper-iframe.html"
				permission-dialog-url="<?php echo esc_url( $base ); ?>/permission-dialog.html"
				service-worker-url="<?php echo esc_url( $base ); ?>/service-worker.js"
				></amp-web-push>
			<amp-web-push-widget
				visibility="unsubscribed"
				layout="fixed"
				width="250"
				height="80"
				>
				<button on="tap:amp-web-push.subscribe">Subscribe to Notifications</button>
			</amp-web-push-widget>
			<!-- An unsubscription widget -->
			<amp-web-push-widget
				visibility="subscribed"
				layout="fixed"
				width="250"
				height="80"
			>
				<button on="tap:amp-web-push.unsubscribe">Unsubscribe from Notifications</button>
			</amp-web-push-widget>
			<?php
			$content = ob_get_clean() . $content;
		}
		return $content;
	}
}
PWA::init();
