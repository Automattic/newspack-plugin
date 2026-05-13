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
		$page = filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		return in_array( $page, [ $this->slug, self::SLUG_ADD ], true );
	}

	/**
	 * Render the container div. Override the parent so the id matches the current page slug,
	 * not `$this->slug`. Required because React mounts into `getElementById(pageParam)`.
	 */
	public function render_wizard() {
		$page = filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$id   = in_array( $page, [ $this->slug, self::SLUG_ADD ], true ) ? $page : $this->slug;
		?>
		<div class="newspack-wizard <?php echo esc_attr( $id ); ?>" id="<?php echo esc_attr( $id ); ?>"></div>
		<?php
	}

	/**
	 * Register admin pages.
	 *
	 * Both pages are ALWAYS registered as hidden so direct URL navigation works.
	 * When the user is on either page, a visible top-level menu with sub-items is
	 * also registered so the demo's IA can be observed in the sidebar.
	 */
	public function add_page() {
		// Always register both slugs as hidden so direct URL access works.
		add_submenu_page(
			'hidden',
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
		add_submenu_page(
			'hidden',
			__( 'Add Rolling Content', 'newspack-plugin' ),
			__( 'Add Rolling Content', 'newspack-plugin' ),
			$this->capability,
			self::SLUG_ADD,
			[ $this, 'render_wizard' ]
		);

		if ( ! $this->is_wizard_page() ) {
			return;
		}

		$icon = sprintf(
			'data:image/svg+xml;base64,%s',
			base64_encode( Newspack_UI_Icons::get_svg( 'collections' ) )
		);

		add_menu_page(
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ],
			$icon
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
	 * Enqueue scripts and styles.
	 *
	 * The parent class's slug check is too strict (single slug). We replicate the
	 * parts we need so both demo pages get the shared `newspack-wizards` chrome.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}

		Newspack::load_common_assets();

		// Data carrier script (no source).
		wp_register_script( 'newspack_data', '', [], '1.0', false );
		wp_localize_script(
			'newspack_data',
			'newspack_urls',
			[
				'public_path' => Newspack::plugin_url() . '/dist/',
				'site'        => get_site_url(),
			]
		);
		wp_enqueue_script( 'newspack_data' );

		// Shared wizards bundle (contains the components map our routes are added to).
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
