<?php
/**
 * Wizard Traits - Admin Tabs
 * 
 * @package Newspack
 */

namespace Newspack\Wizards\Traits;

use Newspack\Newspack;

/**
 * Trait Admin_Tabs
 *
 * Provides methods to enqueue admin tabs JavaScript and localize script data.
 *
 * @package Newspack\Wizards\Traits
 */
trait Admin_Tabs {

	/**
	 * Holds the admin tabs data.
	 *
	 * @var array
	 */
	protected $tabs = [];

	/**
	 * Enqueue the admin tabs script with localized data.
	 *
	 * @param array $tabs Array of tabs data to be localized.
	 */
	public function enqueue_admin_tabs( $tabs = [] ) {
		if ( empty( $tabs ) ) {
			return;
		}
		$this->tabs = $tabs;
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_tabs_js' ] );
		add_action(
			'all_admin_notices',
			function () {
				?>
			<div id="newspack-wizards-admin-tabs" class="newspack-wizards-admin-tabs"></div>
				<?php
			} 
		);
	}

	/**
	 * Enqueue the admin tabs JavaScript file and localize the tabs data.
	 */
	public function enqueue_admin_tabs_js() {
		$wizards_admin_tabs = include dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/wizards-admin-tabs.asset.php';
		wp_register_script(
			'newspack-wizards-admin-tabs',
			Newspack::plugin_url() . '/dist/wizards-admin-tabs.js',
			[ 'wp-components' ],
			$wizards_admin_tabs['version'] ?? NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_enqueue_script( 'newspack-wizards-admin-tabs' );
		wp_localize_script( 'newspack-wizards-admin-tabs', 'newspackWizardsAdminTabs', $this->tabs );
	}
}
