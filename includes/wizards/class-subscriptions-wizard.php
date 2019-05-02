<?php
/**
 * Newspack subscriptions setup and management.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for managing subscriptions.
 */
class Subscriptions_Wizard extends Wizard {

	/**
	 * The name of this wizard.
	 *
	 * @var string
	 */
	protected $name = 'Subscriptions';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-subscriptions-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'edit_products';

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
			'newspack-subscriptions-wizard', 
			Newspack::plugin_url() . '/assets/dist/subscriptions.js', 
			[ 'wp-components' ], 
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/subscriptions.js' ), 
			true 
		);

		wp_register_style(
			'newspack-subscriptions-wizard',
			Newspack::plugin_url() . '/assets/dist/subscriptions-style.css',
			[ 'newspack-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/subscriptions-style.css' )
		);
		wp_style_add_data( 'newspack-subscriptions-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-subscriptions-wizard' );
	}
}
new Subscriptions_Wizard();
