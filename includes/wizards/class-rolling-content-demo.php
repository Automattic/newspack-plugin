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
	 * Delegate to the parent class so the standard wizard chrome (newspack_urls,
	 * newspack_aux_data, newspack-wizards registration, etc.) gets set up.
	 * The parent's enqueue function checks `$_GET['page'] === $this->slug` and
	 * bails otherwise; for the SLUG_ADD page we temporarily spoof `page` so the
	 * parent runs, then restore it.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- $_GET['page'] is only stored briefly and restored verbatim.
		$original_page = isset( $_GET['page'] ) ? $_GET['page'] : null;
		$_GET['page']  = $this->slug;
		parent::enqueue_scripts_and_styles();
		if ( null === $original_page ) {
			unset( $_GET['page'] );
		} else {
			$_GET['page'] = $original_page;
		}

		wp_enqueue_script( 'newspack-wizards' );
	}
}
