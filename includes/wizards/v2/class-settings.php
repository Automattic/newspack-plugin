<?php
/**
 * Newspack's Settings Wizard
 *
 * @package Newspack
 */

namespace Newspack\v2;

use Newspack\Wizard;
use Newspack\Newspack;
use Newspack\OAuth;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Settings
 */
class Settings extends Wizard {
	/**
	 * This setting name
	 *
	 * @var string
	 */
	public $name = 'settings';
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-settings-wizard';

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
		return esc_html__( 'Settings', 'newspack' );
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			"newspack-{$this->name}-wizard",
			Newspack::plugin_url() . "/dist/{$this->name}.js",
			$this->get_script_dependencies(),
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			"newspack-{$this->name}-wizard",
			"newspack_{$this->name}_data",
			[
				'can_connect_google'   => OAuth::is_proxy_configured( 'google' ),
				'can_connect_fivetran' => OAuth::is_proxy_configured( 'fivetran' ),
				'can_use_webhooks'     => defined( 'NEWSPACK_EXPERIMENTAL_WEBHOOKS' ) && NEWSPACK_EXPERIMENTAL_WEBHOOKS,
			]
		);

		wp_register_style(
			"newspack-{$this->name}-wizard",
			Newspack::plugin_url() . "/dist/{$this->name}.css",
			$this->get_style_dependencies(),
			NEWSPACK_PLUGIN_VERSION
		);
		wp_style_add_data( "newspack-{$this->name}-wizard", 'rtl', 'replace' );
		wp_enqueue_style( "newspack-{$this->name}-wizard" );
	}
}

add_action(
	'admin_notices',
	function() {
		echo '<a href="https://newspack.com" target="_blank" class="newspack-newsletters__banner"></a>';
	}
);
