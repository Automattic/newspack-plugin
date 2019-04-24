<?php
/**
 * Common functionality for admin wizards.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Common functionality for admin wizards.
 */
abstract class Wizard {

	protected $name = '';
	protected $slug = '';
	protected $capability = 'manage_options';

	/**
	 * Initialize.
	 */
	public function init() {
		add_action( 'admin_menu', [ $this, 'add_dashboard_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
	}

	public function add_dashboard_page() {
		add_dashboard_page( $this->name, $this->name, $this->capability, $this->slug, [ $this, 'render_wizard' ] );
	}

	public function render_wizard() {
		$screen = isset( $_GET['screen'] ) && $_GET['screen'] ? sanitize_title( $_GET['screen'] ) : $this->get_home_screen();
		$render_method = 'render_' . $screen . '_screen';
		if ( method_exists( $this, $render_method ) ) {
			$this->render_container_header();
			$this->$render_method();
			$this->render_container_footer();
		}
	}

	protected function render_container_header() {
		?>
		<div class="newspack-wizard">
		<?php
	}

	protected function render_container_footer() {
		?>
		</div>
		<?php
	}

	abstract protected function get_home_screen();

	public function enqueue_scripts_and_styles() {
		if ( $this->slug !== filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) ) {
			return;
		}

		wp_register_style(
			'newspack_wizard',
			Newspack::plugin_url() . '/assets/css/wizard.css',
			[],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/css/wizard.css' )
		);
		wp_style_add_data( 'newspack_wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack_wizard' );
	}
}
