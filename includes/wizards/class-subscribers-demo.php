<?php
/**
 * Newspack Subscribers Demo.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Subscribers demo wizard.
 */
class Subscribers_Demo extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-subscribers-demo';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Whether the wizard should be displayed in the Newspack submenu.
	 *
	 * @var bool
	 */
	protected $hidden = true;

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Subscribers demo', 'newspack' );
	}

	/**
	 * Enqueue Subscribers Demo scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-subscribers-demo',
			Newspack::plugin_url() . '/dist/subscribersDemo.js',
			$this->get_script_dependencies( [ 'wp-html-entities' ] ),
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_enqueue_style(
			'newspack-subscribers-demo',
			Newspack::plugin_url() . '/dist/subscribersDemo.css',
			[ 'wp-components' ],
			NEWSPACK_PLUGIN_VERSION
		);
	}
}
