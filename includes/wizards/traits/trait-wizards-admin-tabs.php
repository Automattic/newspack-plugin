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
	 * @param array $args Tabs arguments. Title and tabs array.
	 */
	public function enqueue_admin_tabs( $args = [] ) {
		if ( empty( $args['tabs'] ) ) {
			return;
		}
		$this->tabs = $args['tabs'];
		$this->title = $args['title'] ?? __( 'Newspack Settings', 'newspack-plugin' );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_tabs_js' ] );
		add_action( 'all_admin_notices', [ $this, 'render' ] );
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
		wp_localize_script(
			'newspack-wizards-admin-tabs',
			'newspackWizardsAdminTabs',
			[
				'tabs'  => $this->tabs,
				'title' => $this->title,
			] 
		);
	}

	/**
	 * Add necessary markup to bind React app to. The initial markup is replaced by React app and serves as a loading screen.
	 */
	public static function render() {
		?>
		<div id="newspack-wizards-admin-tabs" class="newspack-wizards-admin-tabs">
			<div class="newspack-wizard__header">
				<div class="newspack-wizard__header__inner">
					<div class="newspack-wizard__title">
						<svg xmlns="http://www.w3.org/2000/svg" height="36" width="36" viewBox="0 0 32 32" class="newspack-icon" aria-hidden="true" focusable="false">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M32 16c0 8.836-7.164 16-16 16-8.837 0-16-7.164-16-16S7.164 0 16 0s16 7.164 16 16zm-10.732.622h1.72v-1.124h-2.823l1.103 1.124zm-3.249-3.31h4.97v-1.124h-6.072l1.102 1.124zm-3.248-3.31h8.217V8.877h-9.32l1.103 1.125zM9.01 8.877l13.977 14.246h-4.66l-5.866-5.98v5.98h-3.45V8.877z" />
						</svg>
						<div>
							<h2><?php _e( 'Loading...', 'newspack-plugin' ); ?></h2>
						</div>
					</div>
				</div>
			</div>
			<div class="newspack-tabbed-navigation">
				<ul>
					<li><a href="#"></a></li>
				</ul>
			</div>
		</div>
		<?php
	}
}
