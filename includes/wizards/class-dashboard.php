<?php
/**
 * Newspack dashboard.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Common functionality for admin wizards. Override this class.
 */
class Dashboard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack';

	/**
	 * The capability required to access this.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Priority setting for ordering admin submenu items. Dashboard must come first.
	 *
	 * @var int.
	 */
	protected $menu_priority = 1;

	/**
	 * Initialize.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_page' ], 1 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
	}

	/**
	 * Get the information required to build the dashboard.
	 * Each tier of the dashboard is an array.
	 * Each card within the tier is an array of [slug, name, url, description, svg, status].
	 *
	 * @return array
	 */
	protected function get_dashboard() {
		$dashboard = [
			[
				'slug'        => 'site-design',
				'name'        => esc_html__( 'Site Design', 'newspack' ),
				'url'         => admin_url( 'customize.php' ),
				'description' => esc_html__( 'Branding, color, typography, layouts', 'newspack' ),
				'svg'         => 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z',
				'status'      => 'enabled',
			],
			[
				'slug'        => 'reader-revenue',
				'name'        => Wizards::get_name( 'reader-revenue' ),
				'url'         => Wizards::get_url( 'reader-revenue' ),
				'description' => esc_html__( 'Membership, paywall, subscriptions', 'newspack' ),
				'svg'         => 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
				'status'      => Checklists::get_status( 'reader-revenue' ),
			],
			[
				'slug'        => 'performance',
				'name'        => esc_html__( 'Performance', 'newspack' ),
				'url'         => admin_url( 'admin.php?page=newspack-performance-wizard' ),
				'description' => esc_html__( 'Page Speed, AMP, Progressive Web App', 'newspack' ),
				'svg'         => 'M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z',
			],
			[
				'slug'        => 'advertising',
				'name'        => Wizards::get_name( 'advertising' ),
				'url'         => Wizards::get_url( 'advertising' ),
				'description' => esc_html__( 'Content monetization', 'newspack' ),
				'svg'         => 'M12 8H4a2 2 0 00-2 2v4a2 2 0 002 2h1v4a1 1 0 001 1h2a1 1 0 001-1v-4h3l5 4V4l-5 4m9.5 4c0 1.71-.96 3.26-2.5 4V8c1.53.75 2.5 2.3 2.5 4z',
				'status'      => Checklists::get_status( 'advertising' ),
			],
			[
				'slug'        => 'seo',
				'name'        => Wizards::get_name( 'seo' ),
				'url'         => Wizards::get_url( 'seo' ),
				'description' => esc_html__( 'Search engine and social optimization', 'newspack' ),
				'svg'         => 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
			],
			[
				'slug'        => 'engagement',
				'name'        => Wizards::get_name( 'engagement' ),
				'url'         => Wizards::get_url( 'engagement' ),
				'description' => Wizards::get_description( 'engagement' ),
				'svg'         => 'M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z',
				'status'      => 'enabled',
			],
			[
				'slug'        => 'analytics',
				'name'        => Wizards::get_name( 'analytics' ),
				'url'         => Wizards::get_url( 'analytics' ),
				'description' => esc_html__( 'Track traffic and activity', 'newspack' ),
				'svg'         => 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
				'status'      => 'enabled',
			],
			[
				'slug'        => 'syndication',
				'name'        => Wizards::get_name( 'syndication' ),
				'url'         => Wizards::get_url( 'syndication' ),
				'description' => esc_html__( 'Apple News, Facebook Instant Articles', 'newspack' ),
				'svg'         => 'M22 8l-4-4v3H3v2h15v3l4-4zM2 16l4 4v-3h15v-2H6v-3l-4 4z',
				'status'      => Checklists::get_status( 'syndication' ),
			],
		];

		return $dashboard;
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Newspack', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'The Newspack hub', 'newspack' );
	}

	/**
	 * Get the duration of this wizard.
	 *
	 * @return string A description of the expected duration (e.g. '10 minutes').
	 */
	public function get_length() {
		return esc_html__( '1 day', 'newspack' );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		$icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjE4cHgiIGhlaWdodD0iNjE4cHgiIHZpZXdCb3g9IjAgMCA2MTggNjE4IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHBhdGggZD0iTTMwOSwwIEM0NzkuNjU2NDk1LDAgNjE4LDEzOC4zNDQyOTMgNjE4LDMwOS4wMDE3NTkgQzYxOCw0NzkuNjU5MjI2IDQ3OS42NTY0OTUsNjE4IDMwOSw2MTggQzEzOC4zNDM1MDUsNjE4IDAsNDc5LjY1OTIyNiAwLDMwOS4wMDE3NTkgQzAsMTM4LjM0NDI5MyAxMzguMzQzNTA1LDAgMzA5LDAgWiBNMTc0LDE3MSBMMTc0LDI2Mi42NzEzNTYgTDE3NS4zMDUsMjY0IEwxNzQsMjY0IEwxNzQsNDQ2IEwyNDEsNDQ2IEwyNDEsMzMwLjkxMyBMMzUzLjk5Mjk2Miw0NDYgTDQ0NCw0NDYgTDE3NCwxNzEgWiBNNDQ0LDI5OSBMMzg5LDI5OSBMNDEwLjQ3NzYxLDMyMSBMNDQ0LDMyMSBMNDQ0LDI5OSBaIE00NDQsMjM1IEwzMjcsMjM1IEwzNDguMjQ1OTE5LDI1NyBMNDQ0LDI1NyBMNDQ0LDIzNSBaIE00NDQsMTcxIEwyNjQsMTcxIEwyODUuMjkwNTEyLDE5MyBMNDQ0LDE5MyBMNDQ0LDE3MSBaIiBpZD0iQ29tYmluZWQtU2hhcGUiIGZpbGw9IiMyQTdERTEiPjwvcGF0aD4KICAgIDwvZz4KPC9zdmc+';
		add_menu_page(
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ],
			$icon,
			3
		);
		$first_subnav_title = get_option( NEWSPACK_SETUP_COMPLETE ) ? __( 'Dashboard' ) : __( 'Setup' );
		add_submenu_page(
			$this->slug,
			$first_subnav_title,
			$first_subnav_title,
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Load up JS/CSS.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_register_script(
			'newspack-dashboard',
			Newspack::plugin_url() . '/assets/dist/dashboard.js',
			$this->get_script_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/dashboard.js' ),
			true
		);
		wp_localize_script( 'newspack-dashboard', 'newspack_dashboard', $this->get_dashboard() );
		wp_enqueue_script( 'newspack-dashboard' );

		wp_register_style(
			'newspack-dashboard',
			Newspack::plugin_url() . '/assets/dist/dashboard.css',
			$this->get_style_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/dashboard.css' )
		);
		wp_style_add_data( 'newspack-dashboard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-dashboard' );
	}
}
