<?php
/**
 * Newspack Temporary Components Demo.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Temporary components demo.
 */
class Components_Demo extends Wizard {

	/**
	 * The name of this wizard.
	 *
	 * @var string
	 */
	protected $name = 'Components Demo';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-components-demo';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

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
			'newspack-components-demo',
			Newspack::plugin_url() . '/assets/dist/componentsDemo.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/componentsDemo.js' ),
			true
		);

		wp_register_style(
			'newspack-components-demo',
			Newspack::plugin_url() . '/assets/dist/componentsDemo.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/componentsDemo.css' )
		);
		wp_style_add_data( 'newspack-components-demo', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-components-demo' );
	}
}
new Components_Demo();
