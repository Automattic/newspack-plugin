<?php
/**
 * Newspack address/payments/api keys/etc. setup.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up general store info.
 */
class Onboarding_Wizard extends Wizard {

	/**
	 * The name of this wizard.
	 *
	 * @var string
	 */
	protected $name = 'Onboarding';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-onboarding-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	public function register_api_endpoints() {

	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();
		wp_enqueue_media();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-onboarding-wizard',
			Newspack::plugin_url() . '/assets/dist/onboarding.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/onboarding.js' ),
			true
		);

		wp_register_style(
			'newspack-onboarding-wizard',
			Newspack::plugin_url() . '/assets/dist/onboarding.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/onboarding.css' )
		);
		wp_style_add_data( 'newspack-onboarding-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-onboarding-wizard' );
	}
}
new Onboarding_Wizard();
