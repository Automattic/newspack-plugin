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
	 * Display a link to this wizard in the Newspack submenu.
	 *
	 * @var bool
	 */
	protected $hidden = false;

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
				'name'        => Checklists::get_name( 'reader-revenue' ),
				'url'         => Checklists::get_url( 'reader-revenue' ),
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
				'name'        => Checklists::get_name( 'advertising' ),
				'url'         => Checklists::get_url( 'advertising' ),
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
				'name'        => esc_html__( 'Engagement', 'newspack' ),
				'url'         => '#',
				'description' => esc_html__( 'Newsletters, social, commenting, UCG', 'newspack' ),
				'image'       => Newspack::plugin_url() . '/assets/wizards/dashboard/engagement-icon.svg',
				'status'      => 'disabled',
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
		$icon = 'data:image/svg+xml;base64,PHN2ZyBpZD0iZjU0YWJkZjgtZTI5Ny00YTRmLWJjZTYtOTFiZmY5NjZkNTdlIiBkYXRhLW5hbWU9IkxheWVyIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDIyMiAyMjIiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuYjMxM2MzYWQtYzkyNC00ZjI3LTg1MzktOThiYTBiNjhmNGJjIHsKICAgICAgICBmaWxsOiAjMmE3ZGUxOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8dGl0bGU+bmV3c3BhY2stbWFyazwvdGl0bGU+CiAgPHBhdGggY2xhc3M9ImIzMTNjM2FkLWM5MjQtNGYyNy04NTM5LTk4YmEwYjY4ZjRiYyIgZD0iTTI2MS41LDEzMUExMTEsMTExLDAsMSwwLDM3Mi42LDI0MiwxMTEsMTExLDAsMCwwLDI2MS41LDEzMVpNMjE2LjEsMjg3LjRWMjU3LjJsMzAuMywzMC4yWm02MC42LDAtNjAuNi02MC41VjE5Ni42TDMwNywyODcuNFpNMzA3LDI0NkgyOTUuOGwtNy4yLTcuMkgzMDdabTAtMjEuMkgyNzQuN2wtNy4yLTcuMUgzMDdabTAtMjEuMUgyNTMuNmwtNy4yLTcuMUgzMDdaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTUwLjUgLTEzMSkiLz4KPC9zdmc+Cg==';
		add_menu_page(
			__( 'Newspack', 'newspack' ),
			__( 'Newspack', 'newspack' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ],
			$icon,
			3
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
			[ 'wp-components' ],
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
