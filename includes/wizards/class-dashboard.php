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
	 * Each card within the tier is an array of [slug, name, url, description, image, status].
	 *
	 * @return array
	 */
	protected function get_dashboard() {
		$dashboard = [
			[
				'slug'        => 'site-design',
				'name'        => esc_html__( 'Site Design', 'newspack' ),
				'url'         => '#',
				'description' => esc_html__( 'Branding, color, typography, layouts', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/site-design-icon.svg',
				'status'      => 'disabled',
			],
			[
				'slug'        => 'reader-revenue',
				'name'        => Wizards::get_name( 'reader-revenue' ),
				'url'         => Wizards::get_url( 'reader-revenue' ),
				'description' => esc_html__( 'Membership, paywall, subscriptions', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/reader-revenue-icon.svg',
				'status'      => Checklists::get_status( 'reader-revenue' ),
			],
			[
				'slug'        => 'performance',
				'name'        => esc_html__( 'Performance', 'newspack' ),
				'url'         => admin_url( 'admin.php?page=newspack-performance-wizard' ),
				'description' => esc_html__( 'Page Speed, AMP, Progressive Web App', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/performance-icon.svg',
			],
			[
				'slug'        => 'advertising',
				'name'        => Wizards::get_name( 'advertising' ),
				'url'         => Wizards::get_url( 'advertising' ),
				'description' => esc_html__( 'Content monetization', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/advertising-icon.svg',
				'status'      => Checklists::get_status( 'advertising' ),
			],
			[
				'slug'        => 'seo',
				'name'        => esc_html__( 'SEO', 'newspack' ),
				'url'         => '#',
				'description' => esc_html__( 'Search engine and social optimization', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/seo-icon.svg',
				'status'      => 'disabled',
			],
			[
				'slug'        => 'engagement',
				'name'        => Checklists::get_name( 'engagement' ),
				'url'         => Checklists::get_url( 'engagement' ),
				'description' => esc_html__( 'Newsletters, social, commenting, UCG', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/engagement-icon.svg',
				'status'      => Checklists::get_status( 'engagement' ),
			],
			[
				'slug'        => 'analytics',
				'name'        => esc_html__( 'Analytics', 'newspack' ),
				'url'         => Wizards::get_url( 'google-analytics' ),
				'description' => esc_html__( 'Track traffic and activity', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/analytics-icon.svg',
				'status'      => Wizards::is_completed( 'google-analytics' ) ? 'completed' : 'enabled',
			],
			[
				'slug'        => 'syndication',
				'name'        => esc_html__( 'Syndication', 'newspack' ),
				'url'         => '#',
				'description' => esc_html__( 'Apple News, Facebook Instant Articles', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/syndication-icon.svg',
				'status'      => 'disabled',
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
			[ 'wp-components', 'wp-api-fetch' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/dashboard.js' ),
			true
		);
		wp_localize_script( 'newspack-dashboard', 'newspack_dashboard', $this->get_dashboard() );
		wp_enqueue_script( 'newspack-dashboard' );

		wp_register_style(
			'newspack-dashboard',
			Newspack::plugin_url() . '/assets/dist/dashboard.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/dashboard.css' )
		);
		wp_style_add_data( 'newspack-dashboard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-dashboard' );
	}
}
