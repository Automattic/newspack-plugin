<?php
/**
 * Newspack Rolling Content Demo.
 *
 * A hidden, URL-gated admin area used to explore DataViews patterns with
 * fake in-memory data. Not intended for production use.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Rolling Content demo wizard.
 */
class Rolling_Content_Demo extends Wizard {

	/**
	 * The slug of the main page (All Rolling Content).
	 *
	 * @var string
	 */
	protected $slug = 'newspack-rolling-content';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Hidden from Newspack's own submenu; this wizard manages its own top-level menu conditionally.
	 *
	 * @var bool
	 */
	protected $hidden = true;

	/**
	 * Slug for the "Add Rolling Content" placeholder page.
	 */
	const SLUG_ADD = 'newspack-rolling-content-add';

	/**
	 * Get the name for this wizard.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Rolling Content', 'newspack-plugin' );
	}

	/**
	 * Override the parent slug check so both demo pages are recognized.
	 *
	 * @return bool
	 */
	public function is_wizard_page() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		return in_array( $page, [ $this->slug, self::SLUG_ADD ], true );
	}

	/**
	 * Render the container div. Override the parent so the id matches the current page slug,
	 * not `$this->slug`. Required because React mounts into `getElementById(pageParam)`.
	 */
	public function render_wizard() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		$id   = in_array( $page, [ $this->slug, self::SLUG_ADD ], true ) ? $page : $this->slug;
		?>
		<div class="newspack-wizard <?php echo esc_attr( $id ); ?>" id="<?php echo esc_attr( $id ); ?>"></div>
		<?php
	}

	/**
	 * Register admin pages.
	 *
	 * The visible top-level menu and its sub-items are only registered when the
	 * user is actually on one of the demo pages. URL access still works because
	 * `admin_menu` fires before WP validates the slug — `$_GET['page']` is set
	 * by the time `is_wizard_page()` runs, the menu registers, and WP accepts
	 * the page.
	 */
	public function add_page() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}

		add_filter( 'parent_file', [ $this, 'set_parent_file' ] );
		add_filter( 'submenu_file', [ $this, 'set_submenu_file' ] );

		$icon = sprintf(
			'data:image/svg+xml;base64,%s',
			base64_encode( Newspack_UI_Icons::get_svg( 'collections' ) )
		);

		// Anchor the menu near the top of the sidebar (just after Dashboard at pos 2)
		// so the demo is easy to find — `add_menu_page` defaults to appending, which
		// pushes the demo below every other plugin's menu.
		add_menu_page(
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ],
			$icon,
			'2.5'
		);
		add_submenu_page(
			$this->slug,
			$this->get_name(),
			__( 'All Rolling Content', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
		add_submenu_page(
			$this->slug,
			__( 'Add Rolling Content', 'newspack-plugin' ),
			__( 'Add Rolling Content', 'newspack-plugin' ),
			$this->capability,
			self::SLUG_ADD,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Force-highlight the top-level menu when on any rolling-content page.
	 * Required because WP's automatic highlighting can lose the trail through
	 * the conditional menu registration.
	 *
	 * @param string $parent_file The current parent file.
	 * @return string
	 */
	public function set_parent_file( $parent_file ) {
		return $this->slug;
	}

	/**
	 * Highlight the correct submenu item for the current page.
	 *
	 * @param string $submenu_file The current submenu file.
	 * @return string
	 */
	public function set_submenu_file( $submenu_file ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		return in_array( $page, [ $this->slug, self::SLUG_ADD ], true ) ? $page : $submenu_file;
	}

	/**
	 * Enqueue scripts and styles.
	 *
	 * Replicates the relevant parts of the parent class's enqueue logic. We can't
	 * just call `parent::enqueue_scripts_and_styles()` because its slug check uses
	 * `filter_input(INPUT_GET, 'page')`, which reads from the frozen request state
	 * and ignores any local `$_GET` mutations — so it would bail on the SLUG_ADD
	 * page.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}

		Newspack::load_common_assets();

		// Data carrier (no source script).
		wp_register_script( 'newspack_data', '', [], '1.0', false );

		$plugin_data = get_plugin_data( NEWSPACK_PLUGIN_FILE );
		$urls        = [
			'dashboard'      => Wizards::get_url( 'newspack-dashboard' ),
			'public_path'    => Newspack::plugin_url() . '/dist/',
			'bloginfo'       => [ 'name' => get_bloginfo( 'name' ) ],
			'plugin_version' => [ 'label' => $plugin_data['Name'] . ' ' . $plugin_data['Version'] ],
			'homepage'       => get_edit_post_link( get_option( 'page_on_front', false ) ),
			'site'           => get_site_url(),
			'support'        => esc_url( 'https://help.newspack.com/' ),
			'support_email'  => false,
		];

		$aux_data = [
			'is_e2e'              => Starter_Content::is_e2e(),
			'is_debug_mode'       => Newspack::is_debug_mode(),
			'has_completed_setup' => get_option( NEWSPACK_SETUP_COMPLETE ),
			'site_title'          => get_option( 'blogname' ),
			'is_managed'          => method_exists( 'Newspack_Manager', 'is_connected_to_manager' ) && \Newspack_Manager::is_connected_to_manager(),
		];

		wp_localize_script( 'newspack_data', 'newspack_urls', $urls );
		wp_localize_script( 'newspack_data', 'newspack_aux_data', $aux_data );
		wp_enqueue_script( 'newspack_data' );

		wp_register_script(
			'newspack-wizards',
			Newspack::plugin_url() . '/dist/wizards.js',
			$this->get_script_dependencies(),
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		wp_enqueue_script( 'newspack-wizards' );
	}
}
