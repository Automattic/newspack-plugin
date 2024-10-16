<?php
/**
 * Google Site Kit integration class.
 *
 * @package Newspack
 */

namespace Newspack;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Core\Authentication\Has_Connected_Admins;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class GoogleSiteKit {
	const GA4_SETUP_DONE_OPTION_NAME = 'newspack_analytics_has_set_up_ga4';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'admin_init', [ __CLASS__, 'setup_sitekit_ga4' ] );
		add_action( 'wp_footer', [ __CLASS__, 'insert_ga4_analytics' ] );
		add_filter( 'option_googlesitekit_analytics_settings', [ __CLASS__, 'filter_ga_settings' ] );
		add_filter( 'googlesitekit_gtag_opt', [ __CLASS__, 'add_ga_custom_parameters' ] );
		add_action( 'delete_option_' . self::get_sitekit_ga4_has_connected_admin_option_name(), [ __CLASS__, 'log_disconnect' ] );
		add_filter( 'update_user_metadata', [ __CLASS__, 'maybe_log_disconnect' ], 10, 5 );
	}

	/**
	 * Filter GA settings.
	 *
	 * @param array $googlesitekit_analytics_settings GA settings.
	 */
	public static function filter_ga_settings( $googlesitekit_analytics_settings ) {
		if ( in_array( 'loggedinUsers', $googlesitekit_analytics_settings['trackingDisabled'] ) ) {
			$googlesitekit_analytics_settings['trackingDisabled'] = [ 'contentCreators' ];
		}
		return $googlesitekit_analytics_settings;
	}

	/**
	 * Add GA4 analytics pageview reporting to AMP pages.
	 */
	public static function insert_ga4_analytics() {
		if ( ! function_exists( 'is_amp_endpoint' ) || ! is_amp_endpoint() ) {
			return;
		}
		$sitekit_ga4_settings = self::get_sitekit_ga4_settings();
		if ( false === $sitekit_ga4_settings || ! $sitekit_ga4_settings['useSnippet'] || ! isset( $sitekit_ga4_settings['measurementID'] ) ) {
			return;
		}
		$ga4_measurement_id = $sitekit_ga4_settings['measurementID'];
		// See https://github.com/analytics-debugger/google-analytics-4-for-amp.
		$config_path = Newspack::plugin_url() . '/includes/raw_assets/ga4.json';

		?>
			<amp-analytics type="googleanalytics" config="<?php echo esc_attr( $config_path ); ?>" data-credentials="include">
				<script type="application/json">
					{
						"vars": {
							"GA4_MEASUREMENT_ID": "<?php echo esc_attr( $ga4_measurement_id ); ?>",
							"DEFAULT_PAGEVIEW_ENABLED": true,
							"GOOGLE_CONSENT_ENABLED": false
						}
					}
				</script>
			</amp-analytics>
		<?php
	}

	/**
	 * Get whether the current user is connected.
	 *
	 * @return bool Whether the user is connected to Google through Site Kit.
	 */
	private static function is_user_connected() {
		global $wpdb;

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		return ! empty( get_user_meta( $user_id, $wpdb->prefix . 'googlesitekit_site_verified_meta', true ) );
	}

	/**
	 * Get the name of the option under which Site Kit's GA4 settings are stored.
	 */
	private static function get_sitekit_ga4_settings_option_name() {
		if ( class_exists( 'Google\Site_Kit\Modules\Analytics_4\Settings' ) ) {
			return Settings::OPTION;
		}
		return false;
	}

	/**
	 * Get the name of the option under which Site Kit's GA4 has connected admin flag is stored.
	 */
	private static function get_sitekit_ga4_has_connected_admin_option_name() {
		if ( class_exists( 'Google\Site_Kit\Core\Authentication\Has_Connected_Admins' ) ) {
			return Has_Connected_Admins::OPTION;
		}
		return 'googlesitekit_has_connected_admins';
	}

	/**
	 * Get the name of the option under which Site Kit's disconnected reason is stored.
	 */
	private static function get_sitekit_ga4_disconnected_reason_option_name() {
		if ( class_exists( 'Google\Site_Kit\Core\Authentication\Disconnected_Reason' ) ) {
			return Disconnected_Reason::OPTION;
		}
		return 'googlesitekit_disconnected_reason';
	}

	/**
	 * Get Site Kit's GA4 settings.
	 */
	private static function get_sitekit_ga4_settings() {
		$option_name = self::get_sitekit_ga4_settings_option_name();
		if ( false === $option_name ) {
			return false;
		}
		return get_option( $option_name, false );
	}

	/**
	 * Fetch data for the GA account data and set up GA4.
	 */
	public static function setup_sitekit_ga4() {
		if ( ! class_exists( 'Google\Site_Kit\Core\Modules\Module' ) ) {
			return;
		}
		require_once NEWSPACK_ABSPATH . 'includes/plugins/google-site-kit/class-googlesitekitanalytics.php';

		if ( ! self::is_user_connected() ) {
			return;
		}
		if ( get_option( self::GA4_SETUP_DONE_OPTION_NAME, false ) ) {
			return;
		}

		$sitekit_ga4_settings = self::get_sitekit_ga4_settings();
		if ( false !== $sitekit_ga4_settings && $sitekit_ga4_settings['useSnippet'] && isset( $sitekit_ga4_settings['measurementID'] ) ) {
			return;
		}

		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		$sitekit_ga_settings = get_option( Settings::OPTION, false );
		if ( false === $sitekit_ga_settings || ! isset( $sitekit_ga_settings['accountID'] ) ) {
			return;
		}

		$account_id = $sitekit_ga_settings['accountID'];

		try {
			$newspack_ga  = new GoogleSiteKitAnalytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
			$ga4_settings = $newspack_ga->get_ga4_settings( $account_id );
			if ( false === $ga4_settings ) {
				return;
			}
			$ga4_settings['ownerID']    = get_current_user_id();
			$ga4_settings['useSnippet'] = true;

			$sitekit_ga4_option_name = self::get_sitekit_ga4_settings_option_name();
			Logger::log( 'Updating Site Kit GA4 settings option.' );
			update_option( self::GA4_SETUP_DONE_OPTION_NAME, true, true );
			update_option( $sitekit_ga4_option_name, $ga4_settings, true );
		} catch ( \Throwable $e ) {
			Logger::error( 'Failed updating Site Kit GA4 settings option: ' . $e->getMessage() );
		}
	}

	/**
	 * Filter the GA config to add custom parameters.
	 *
	 * @param array $gtag_opt gtag config options.
	 */
	public static function add_ga_custom_parameters( $gtag_opt ) {
		$enable_fe_custom_params = defined( 'NEWSPACK_GA_ENABLE_CUSTOM_FE_PARAMS' ) && NEWSPACK_GA_ENABLE_CUSTOM_FE_PARAMS;
		if ( ! $enable_fe_custom_params ) {
			return $gtag_opt;
		}
		$custom_params = \Newspack\Data_Events\Connectors\GA4::get_custom_parameters();
		return array_merge( $custom_params, $gtag_opt );
	}

	/**
	 * Maybe log disconnect.
	 *
	 * @param bool   $check      Whether to update metadata.
	 * @param int    $object_id  Object ID.
	 * @param string $meta_key   Meta key.
	 * @param mixed  $meta_value Meta value.
	 * @param mixed  $prev_value Previous meta value.
	 */
	public static function maybe_log_disconnect( $check, $object_id, $meta_key, $meta_value, $prev_value ) {
		if (
			// The meta key will have the database prefixed so we need to use str_contains.
			str_contains( $meta_key, self::get_sitekit_ga4_disconnected_reason_option_name() ) &&
			$meta_value !== $prev_value
		) {
			self::log_disconnect(
				self::get_sitekit_ga4_disconnected_reason_option_name(),
				'Google Site Kit has been disconnected with reason ' . $meta_value
			);
		}
		return $check;
	}

	/**
	 * Log when a user disconnects from Google Site Kit.
	 *
	 * @param string $option  The option being updated.
	 * @param string $message The message to log. Optional.
	 */
	public static function log_disconnect( $option, $message = '' ) {
		$code = 'newspack_googlesitekit_disconnect';
		if ( empty( $message ) ) {
			if ( $option === self::get_sitekit_ga4_has_connected_admin_option_name() ) {
				$message = 'Google Site Kit has been disconnected for all admins';
			} else {
				$message = 'Google Site Kit has been disconnected.';
			}
		}
		$e    = new \Exception();
		$data = [
			'backtrace'  => $e->getTraceAsString(),
			'file'       => $code,
			'user_email' => wp_get_current_user()->user_email,
		];
		Logger::newspack_log( $code, $message, $data );
	}
}
GoogleSiteKit::init();
