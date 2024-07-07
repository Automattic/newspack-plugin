<?php
/**
 * Newspack Settings Admin Page
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use Newspack\Donations;
use Newspack\Emails;
use Newspack\Reader_Revenue_Emails;
use Newspack\Wizard;
use Newspack\Salesforce;

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
	 * Priority setting for ordering admin submenu items. Dashboard must come first.
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
		return [
			'connections'       => [
				'label'    => __( 'Connections', 'newspack-plugin' ),
				'path'     => '/',
				'sections' => [
					'plugins'      => [],
					'apis'         => [],
					'recaptcha'    => [],
					'analytics'    => [],
					'customEvents' => $this->sections['custom-events']->get_data(),
				],
			],
			'emails'            => [
				'label'    => __( 'Emails', 'newspack-plugin' ),
				'sections' => [
					'emails' => [
						'all'                     => Emails::get_emails( [ Reader_Revenue_Emails::EMAIL_TYPES['RECEIPT'] ], false ),
						'email_cpt'               => Emails::POST_TYPE,
						'salesforce_redirect_url' => Salesforce::get_redirect_url(),
						'can_use_name_your_price' => Donations::can_use_name_your_price(),
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
