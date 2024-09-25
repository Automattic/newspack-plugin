<?php
/**
 * Newspack dashboard.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Common functionality for admin wizards. Override this class.
 */
class Newspack_Dashboard extends Wizard {

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
	protected $slug = 'newspack-dashboard';

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
	 * Get Dashboard data
	 *
	 * @return [] 
	 */
	public function get_dashboard() {
		return [
			'audience_development' => [
				'title' => __( 'Audience development', 'newspack-plugin' ),
				'desc'  => __( 'Engage your readers more deeply with tools to build customer relationships that drive towards sustainable revenue.', 'newspack-plugin' ),
				'cards' => [
					[
						'icon'  => 'settings',
						'title' => __( 'Configuration', 'newspack-plugin' ),
						'desc'  => __( 'Manage your audience development setup.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
					[
						'icon'  => 'megaphone',
						'title' => __( 'Campaigns', 'newspack-plugin' ),
						'desc'  => __( 'Coordinate prompts across your site to drive metrics.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
					[
						'icon'  => 'gift',
						'title' => __( 'Donations', 'newspack-plugin' ),
						'desc'  => __( 'Bring in revenue through voluntary gifts.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
					[
						'icon'  => 'payment',
						'title' => __( 'Subscriptions', 'newspack-plugin' ),
						'desc'  => __( 'Gate your site\'s content behind a paywall.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
				],
			],
			'newsletters'          => [
				'title'        => __( 'Newsletters', 'newspack-plugin' ),
				'desc'         => __( 'Engage your readers directly in their email inbox.', 'newspack-plugin' ),
				'dependencies' => [
					'newspack-newsletters',
				],
				'cards'        => [
					[
						'icon'  => 'mail',
						'title' => __( 'All Newsletters', 'newspack-plugin' ),
						'desc'  => __( 'See all newsletters you’ve sent out, and start new ones.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_nl_cpt' ),
					],
					[
						'icon'  => 'ad',
						'title' => __( 'Advertising', 'newspack-plugin' ),
						'desc'  => __( 'Get advertising revenue from your newsletters.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
					[
						'icon'  => 'tool',
						'title' => __( 'Settings', 'newspack-plugin' ),
						'desc'  => __( 'Configure tracking and other newsletter settings.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
				],
			],
			'advertising'          => [
				'title'        => __( 'Advertising', 'newspack-plugin' ),
				'desc'         => __( 'Sell space on your site to fund your operations.', 'newspack-plugin' ),
				'dependencies' => [
					'newspack-ads',
				],
				'cards'        => [
					[
						'icon'  => 'ad',
						'title' => __( 'Display Ads', 'newspack-plugin' ),
						'desc'  => __( 'Sell programmatic advertising on your site to drive revenue.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=advertising-display-ads#/' ),
					],
					[
						'icon'  => 'currencyDollar',
						'title' => __( 'Sponsors', 'newspack-plugin' ),
						'desc'  => __( 'Sell sponsored content directly to purchasers.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_spnsrs_cpt' ),
					],
				],
			],
			'listings'             => [
				'title'        => __( 'Listings', 'newspack-plugin' ),
				'desc'         => __( 'Build databases of reusable or user-generated content to use on your site.', 'newspack-plugin' ),
				'dependencies' => [
					'newspack-listings',
				],
				'cards'        => [
					[
						'icon'  => 'blockPostDate',
						'title' => __( 'Events', 'newspack-plugin' ),
						'desc'  => __( 'Easily use the same event information across multiple posts.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_event' ),
					],
					[
						'icon'  => 'store',
						'title' => __( 'Marketplace Listings', 'newspack-plugin' ),
						'desc'  => __( 'Allow users to list items and services for sale.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_mktplce' ),
					],
					[
						'icon'  => 'postList',
						'title' => __( 'Generic Listing', 'newspack-plugin' ),
						'desc'  => __( 'Manage any structured data for use in posts.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_generic' ),
					],
					[
						'icon'  => 'mapMarker',
						'title' => __( 'Places', 'newspack-plugin' ),
						'desc'  => __( 'Create a database of places in your coverage area.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_place' ),
					],
					[
						'icon'  => 'tool',
						'title' => __( 'Settings', 'newspack-plugin' ),
						'desc'  => __( 'Configure the way that Listings work on your site.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=newspack-listings-settings-admin' ), 
					],
				],
				
			],
			// @TODO HUB vs NODE
			'network'              => [
				'title'        => __( 'Network', 'newspack-plugin' ),
				'desc'         => __( 'Manage the way your site\'s content flows across your publishing network.', 'newspack-plugin' ),
				'dependencies' => [
					'newspack-network',
				],
				'cards'        => 'node' === get_option( 'newspack_network_site_role', '' ) ? [
					[
						'icon'  => 'tool',
						'title' => __( 'Settings', 'newspack-plugin' ),
						'desc'  => __( 'Configure how Newspack Network functions.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
				] : [
					[
						'icon'  => 'positionCenterCenter',
						'title' => __( 'Nodes', 'newspack-plugin' ),
						'desc'  => __( 'Manage which sites are part of your content network.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_hub_nodes' ),
					],
					[
						'icon'  => 'rotateRight',
						'title' => __( 'Subscriptions', 'newspack-plugin' ),
						'desc'  => __( 'View all subscriptions across your network.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=np_hub_subscriptions' ),
					],
					[
						'icon'  => 'currencyDollar',
						'title' => __( 'Orders', 'newspack-plugin' ),
						'desc'  => __( 'View all payments across your network.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=np_hub_orders' ),
					],
					[
						'icon'  => 'formatListBullets',
						'title' => __( 'Event Log', 'newspack-plugin' ),
						'desc'  => __( 'Troubleshoot issues by viewing all events across your network.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=newspack-network-event-log' ),
					],
					[
						'icon'  => 'tool',
						'title' => __( 'Settings', 'newspack-plugin' ),
						'desc'  => __( 'Configure how Newspack Network functions.', 'newspack-plugin' ),
						'href'  => '#', // @TODO
					],
				],
			],
		];
	}

	/**
	 * Get Dashboard local data
	 *
	 * @return [] 
	 */
	public function get_local_data() {
		$site_name = get_bloginfo( 'name' );
		$theme_mods = get_theme_mods();
		return [
			'settings'     => [
				'siteName'      => $site_name,
				'headerBgColor' => $theme_mods['header_color_hex'],
			],
			'sections'     => $this->get_dashboard(),
			'plugins'      => get_plugins(),
			'siteStatuses' => [
				'readerActivation' => [
					'label'        => __( 'Reader Activation', 'newspack-plugin' ),
					'statuses'     => [
						'success' => __( 'Enabled', 'newspack-plugin' ),
						'error'   => __( 'Disabled', 'newspack-plugin' ),
					],
					'endpoint'     => '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
					'configLink'   => admin_url( 'admin.php?page=newspack-engagement-wizard#/reader-activation' ),
					'dependencies' => [
						'woocommerce' => [
							'label'    => __( 'Woocommerce', 'newspack-plugin' ),
							'isActive' => is_plugin_active( 'woocommerce/woocommerce.php' ),
						],
					],
				],
				'googleAdManager'  => [
					'label'            => __( 'Google Ad Manager', 'newspack-plugin' ),
					'statuses'         => [
						'error-preflight' => __( 'Proxy Not Configured', 'newspack-plugin' ),
					],
					'endpoint'         => '/newspack/v1/wizard/billboard',
					'isPreflightValid' => ( new Newspack_Ads_Configuration_Manager() )->is_gam_connected(),
					'configLink'       => admin_url( 'admin.php?page=advertising-display-ads' ),
					'dependencies'     => [
						'newspack-ads' => [
							'label'    => __( 'Newspack Ads', 'newspack-plugin' ),
							'isActive' => is_plugin_active( 'newspack-ads/newspack-ads.php' ),
						],
					],
				],
				'googleAnalytics'  => [
					'label'        => __( 'Google Analytics', 'newspack-plugin' ),
					'endpoint'     => '/google-site-kit/v1/modules/analytics-4/data/settings',
					'configLink'   => in_array( 'analytics', get_option( 'googlesitekit_active_modules', [] ) ) ? admin_url( 'admin.php?page=googlesitekit-settings#/connected-services/analytics-4' ) : admin_url( 'admin.php?page=googlesitekit-splash' ),
					'dependencies' => [
						'google-site-kit' => [
							'label'    => __( 'Google Site Kit', 'newspack-plugin' ),
							'isActive' => is_plugin_active( 'google-site-kit/google-site-kit.php' ),
						],
					],
				],
			],
			'quickActions' => [
				[
					'href'  => admin_url( 'post-new.php' ),
					'title' => __( 'Start a new post', 'newspack-plugin' ),
					'icon'  => 'post',
				],
				[
					'href'  => admin_url( 'post-new.php?post_type=newspack_nl_cpt' ),
					'title' => __( 'Draft a newsletter', 'newspack-plugin' ),
					'icon'  => 'mail',
				],
				[
					'href'  => 'https://lookerstudio.google.com/u/0/reporting/b7026fea-8c2c-4c4b-be95-f582ed94f097/page/p_3eqlhk5odd',
					'title' => __( 'Open data dashboard', 'newspack-plugin' ),
					'icon'  => 'dashboard',
				],
			],
		];
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
		$first_subnav_title = get_option( NEWSPACK_SETUP_COMPLETE ) ? __( 'Dashboard', 'newspack' ) : __( 'Setup', 'newspack' );
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

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		/**
		 * JavaScript
		 */
		wp_localize_script(
			'newspack-wizards', 
			'newspackDashboard',
			$this->get_local_data()
		);
		wp_enqueue_script( 'newspack-wizards' );
	}
}
