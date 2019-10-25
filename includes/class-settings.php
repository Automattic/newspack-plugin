<?php
/**
 * Starter content management class.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Manages Settings page.
 */
class Settings {
	/**
	 * Set up hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', [ __CLASS__, 'add_plugin_page' ] );
		add_action( 'admin_init', [ __CLASS__, 'page_init' ] );
	}

	/**
	 * Add options page
	 */
	public static function add_plugin_page() {
		add_options_page(
			'Settings Admin',
			'Newspack',
			'manage_options',
			'newspack-settings-admin',
			[ __CLASS__, 'create_admin_page' ]
		);
	}

	/**
	 * Options page callback
	 */
	public static function create_admin_page() {
		$newspack_debug = get_option( 'newspack_debug' );
		?>
		<div class="wrap">
			<h1>Newspack Settings</h1>
			<form method="post" action="options.php">
			<?php
				settings_fields( 'newspack_options_group' );
				do_settings_sections( 'newspack-settings-admin' );
				submit_button();
			?>
			</form>
		</div>
		<?php
	}

	/**
	 * Register and add settings
	 */
	public static function page_init() {
		register_setting(
			'newspack_options_group',
			'newspack_debug'
		);
		add_settings_section(
			'setting_section_id',
			'Newspack Custom Settings',
			null,
			'newspack-settings-admin'
		);
		add_settings_field(
			'newspack_debug',
			'Debug Mode',
			[ __CLASS__, 'newspack_debug_callback' ],
			'newspack-settings-admin',
			'setting_section_id'
		);
	}

	/**
	 * Get the settings option array and print one of its values
	 */
	public static function newspack_debug_callback() {
		$newspack_debug = get_option( 'newspack_debug', false );
		$newspack_value = $newspack_debug ? 'checked' : '';
		printf(
			'<input type="checkbox" id="newspack_debug" name="newspack_debug" %s />',
			esc_attr( $newspack_value )
		);
	}
}

if ( is_admin() ) {
	Settings::init();
}
