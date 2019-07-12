<?php
/**
 * Sets up Mailchimp for sites with WooCommerce enabled.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Set up Mailchimp.
 */
class Mailchimp_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-mailchimp-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Set up Mailchimp', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Connect your newsroom and members to Mailchimp.', 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '15 minutes', 'newspack' );
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-mailchimp-wizard',
			Newspack::plugin_url() . '/assets/dist/mailchimp.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/mailchimp.js' ),
			true
		);

		wp_register_style(
			'newspack-mailchimp-wizard',
			Newspack::plugin_url() . '/assets/dist/mailchimp.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/mailchimp.css' )
		);
		wp_style_add_data( 'newspack-mailchimp-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-mailchimp-wizard' );
	}
}
