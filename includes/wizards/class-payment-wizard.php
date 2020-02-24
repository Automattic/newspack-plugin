<?php
/**
 * Newspack's Payment Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error, \WP_Query;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Interface for managing payments for Newspack hosted plan.
 */
class Payment_Wizard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-payment-wizard';

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
		return \esc_html__( 'Payment', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Manage payment information for Newspack hosted plan.', 'newspack' );
	}

	/**
	 * Get the duration of this wizard.
	 *
	 * @return string A description of the expected duration (e.g. '10 minutes').
	 */
	public function get_length() {
		return esc_html__( '10 minutes', 'newspack' );
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		\wp_enqueue_script(
			'newspack-payment-wizard',
			Newspack::plugin_url() . '/dist/payment.js',
			$this->get_script_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/payment.js' ),
			true
		);

		\wp_register_style(
			'newspack-payment-wizard',
			Newspack::plugin_url() . '/dist/payment.css',
			$this->get_style_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/payment.css' )
		);
		\wp_style_add_data( 'newspack-payment-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-payment-wizard' );
	}

	/**
	 * Return private Stripe key from environment variable.
	 */
	public static function stripe_key() {
		return ( defined( 'NEWSPACK_STRIPE_KEY' ) && NEWSPACK_STRIPE_KEY ) ? NEWSPACK_STRIPE_KEY : false;
	}
}
