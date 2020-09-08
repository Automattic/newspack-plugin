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
	 * Each card within the tier is an array of [slug, name, url, description, status].
	 *
	 * @return array
	 */
	protected function get_dashboard() {
		$dashboard = [
			[
				'slug'        => 'site-design',
				'name'        => Wizards::get_name( 'site-design' ),
				'url'         => Wizards::get_url( 'site-design' ),
				'description' => esc_html__( 'Branding, color, typography, layouts', 'newspack' ),
				'status'      => 'enabled',
			],
			[
				'slug'        => 'reader-revenue',
				'name'        => Wizards::get_name( 'reader-revenue' ),
				'url'         => Wizards::get_url( 'reader-revenue' ),
				'description' => esc_html__( 'Membership, paywall, subscriptions', 'newspack' ),
				'status'      => Checklists::get_status( 'reader-revenue' ),
			],
			[
				'slug'        => 'advertising',
				'name'        => Wizards::get_name( 'advertising' ),
				'url'         => Wizards::get_url( 'advertising' ),
				'description' => esc_html__( 'Content monetization', 'newspack' ),
				'status'      => Checklists::get_status( 'advertising' ),
			],
			[
				'slug'        => 'syndication',
				'name'        => Wizards::get_name( 'syndication' ),
				'url'         => Wizards::get_url( 'syndication' ),
				'description' => esc_html__( 'Distribute your content across multiple websites', 'newspack' ),
				'status'      => Checklists::get_status( 'syndication' ),
			],
			[
				'slug'        => 'analytics',
				'name'        => Wizards::get_name( 'analytics' ),
				'url'         => Wizards::get_url( 'analytics' ),
				'description' => esc_html__( 'Track traffic and activity', 'newspack' ),
				'status'      => 'enabled',
			],
			[
				'slug'        => 'seo',
				'name'        => Wizards::get_name( 'seo' ),
				'url'         => Wizards::get_url( 'seo' ),
				'description' => esc_html__( 'Search engine and social optimization', 'newspack' ),
			],
			[
				'slug'        => 'health-check',
				'name'        => Wizards::get_name( 'health-check' ),
				'url'         => Wizards::get_url( 'health-check' ),
				'description' => esc_html__( 'Verify and correct site health issues', 'newspack' ),
				'status'      => 'enabled',
			],
			[
				'slug'        => 'engagement',
				'name'        => Wizards::get_name( 'engagement' ),
				'url'         => Wizards::get_url( 'engagement' ),
				'description' => Wizards::get_description( 'engagement' ),
				'status'      => 'enabled',
			],
			[
				'slug'        => 'popups',
				'name'        => Wizards::get_name( 'popups' ),
				'url'         => Wizards::get_url( 'popups' ),
				'description' => Wizards::get_description( 'popups' ),
				'status'      => 'enabled',
			],
			[
				'slug'        => 'updates',
				'name'        => Wizards::get_name( 'updates' ),
				'url'         => Wizards::get_url( 'updates' ),
				'description' => Wizards::get_description( 'updates' ),
				'status'      => 'enabled',
			],
		];

		if ( Support_Wizard::configured() ) {
			$dashboard[] = [
				'slug'        => 'support',
				'name'        => Wizards::get_name( 'support' ),
				'url'         => Wizards::get_url( 'support' ),
				'description' => Wizards::get_description( 'support' ),
				'status'      => 'enabled',
			];
		}

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
			Newspack::plugin_url() . '/dist/dashboard.js',
			$this->get_script_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/dashboard.js' ),
			true
		);
		wp_localize_script( 'newspack-dashboard', 'newspack_dashboard', $this->get_dashboard() );
		wp_enqueue_script( 'newspack-dashboard' );

		wp_register_style(
			'newspack-dashboard',
			Newspack::plugin_url() . '/dist/dashboard.css',
			$this->get_style_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/dashboard.css' )
		);
		wp_style_add_data( 'newspack-dashboard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-dashboard' );
	}
}
