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
	 * The name of this wizard.
	 *
	 * @var string
	 */
	protected $name = 'Newspack';

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
	 * Initialize.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_page' ], 1 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );

		// Temporary filter to demonstrate card status.
		// @todo remove this and do it properly in the checklist class.
		add_filter( 'newspack_dashboard_status_syndication', function() { return 'disabled'; } );
		add_filter( 'newspack_dashboard_status_onboarding', function() { return 'completed'; } );
		add_filter( 'newspack_dashboard_status_newsletter', function() { return 'completed'; } );
	}

	protected function get_dashboard() {
		$dashboard = [
			[
				[
					'name'        => __( 'Onboarding', 'newspack' ),
					'slug'        => 'onboarding',
					'description' => __( 'Lay the groundwork', 'newspack' ),
					'image'       => 'https://ps.w.org/gutenberg/assets/icon-256x256.jpg?rev=1776042',
					'url'         => '#',
				],
			],
			[
				[
					'name'        => __( 'Memberships', 'newspack' ),
					'slug'        => 'memberships',
					'description' => __( 'Set up subscriptions, donations, and paywall', 'newspack' ),
					'image'       => 'https://ps.w.org/gutenberg/assets/icon-256x256.jpg?rev=1776042',
					'url'         => '#',
				],
				[
					'name'        => __( 'Setup newsletter', 'newspack' ),
					'slug'        => 'newsletter',
					'description' => __( 'Reach your audience', 'newspack' ),
					'url'         => '#',
				],
			],
			[
				[
					'name'        => __( 'Analytics', 'newspack' ),
					'slug'        => 'analytics',
					'description' => __( 'Learn about your audience', 'newspack' ),
					'url'         => '#',
				],
				[
					'name'        => __( 'Engage your audience', 'newspack' ),
					'slug'        => 'engagement',
					'description' => __( 'Set up social and commenting integrations', 'newspack' ),
					'url'         => '#',
				],
				[
					'name'        => __( 'Syndicate your content', 'newspack' ),
					'slug'        => 'syndication',
					'description' => __( 'Cross post your articles to other outlets', 'newspack' ),
					'url'         => '#',
				]
			],
		];

		foreach ( $dashboard as &$tier ) {
			foreach ( $tier as &$card ) {
				// The checklist hooks into this filter to manage card statuses.
				// Valid status are: 'enabled', 'disabled', 'completed'.
				$card['status'] = apply_filters( 'newspack_dashboard_status_' . $card['slug'], 'enabled' );
			}
		}

		return $dashboard;
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		add_menu_page( 
			__( 'Newspack', 'newspack' ), 
			__( 'Newspack', 'newspack' ), 
			$this->capability, 
			$this->slug, 
			[ $this, 'render_wizard'] 
		);
	}

	/**
	 * Load up common JS/CSS for wizards.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();
		wp_enqueue_media();

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
new Dashboard();