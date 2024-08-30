<?php
/**
 * Newspack Settings Admin Page
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use Newspack\Emails;
use Newspack\OAuth;
use Newspack\Wizard;
use Newspack\Reader_Revenue_Emails;
use Newspack\Everlit_Configuration_Manager;
use function Newspack\google_site_kit_available;

defined( 'ABSPATH' ) || exit;

/**
 * Common functionality for admin wizards. Override this class.
 */
class Newspack_Settings extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-settings';

	/**
	 * The capability required to access this.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Priority setting for ordering admin submenu items. Settings must come second.
	 *
	 * @var int.
	 */
	protected $menu_priority = 2;

	/**
	 * Get Settings local data
	 *
	 * @return [] 
	 */
	public function get_local_data() {
		$google_site_kit_url = google_site_kit_available() ? admin_url( 'admin.php?page=googlesitekit-settings#/connected-services/analytics-4' ) : admin_url( 'admin.php?page=googlesitekit-splash' );
		return [
			'connections'       => [
				'label'    => __( 'Connections', 'newspack-plugin' ),
				'path'     => '/',
				'sections' => [
					'plugins'      => [
						'editLink' => [
							'everlit'         => 'admin.php?page=everlit_settings',
							'jetpack'         => 'admin.php?page=jetpack#/settings',
							'google-site-kit' => $google_site_kit_url,
						],
						'enabled'  => [
							'everlit' => Everlit_Configuration_Manager::is_enabled(),
						],
					],
					'apis'         => [
						'dependencies' => [
							'googleOAuth' => OAuth::is_proxy_configured( 'google' ),
						],
					],
					'recaptcha'    => [],
					'analytics'    => [
						'editLink'                    => $google_site_kit_url,
						'measurement_id'              => get_option( 'ga4_measurement_id', '' ),
						'measurement_protocol_secret' => get_option( 'ga4_measurement_protocol_secret', '' ),
					],
					'customEvents' => $this->sections['custom-events']->get_data(),
				],
			],
			'emails'            => [
				'label'    => __( 'Emails', 'newspack-plugin' ),
				'sections' => [
					'emails' => [
						'dependencies' => [
							'newspackNewsletters' => is_plugin_active( 'newspack-newsletters/newspack-newsletters.php' ),
						],
						'all'          => Emails::get_emails( [ Reader_Revenue_Emails::EMAIL_TYPES['RECEIPT'] ], false ),
						'postType'     => Emails::POST_TYPE,
					],
				],
			],
			'social'            => [
				'label' => __( 'Social', 'newspack-plugin' ),
			],
			'syndication'       => [
				'label' => __( 'Syndication', 'newspack-plugin' ),
			],
			'seo'               => [
				'label' => __( 'SEO', 'newspack-plugin' ),
			],
			'theme-and-brand'   => [
				'label' => __( 'Theme and Brand', 'newspack-plugin' ),
			],
			'display-settings'  => [
				'label' => __( 'Display Settings', 'newspack-plugin' ),
			],
			'additional-brands' => [
				'label' => __( 'Additional Brands', 'newspack-plugin' ),
			],
		];
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Newspack', 'newspack' );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		add_submenu_page(
			'newspack-dashboard',
			__( 'Newspack / Settings', 'newspack-plugin' ),
			__( 'Settings', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Load up JS/CSS.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		/**
		 * JavaScript
		 */
		wp_localize_script(
			'newspack-wizards', 
			'newspackSettings',
			$this->get_local_data()
		);
		wp_enqueue_script( 'newspack-wizards' );
	}
}
