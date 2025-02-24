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
	 * Use a high priorty so that the Newspack parent menu will be created
	 * prior to submenu items being added.
	 *
	 * @var int
	 */
	protected $admin_menu_priority = 1;

	/**
	 * Get Dashboard data
	 *
	 * @return array Dashboard sections and their configurations.
	 */
	public function get_dashboard() {
		$dashboard = array(
			'audience_development' => array(
				'title' => __( 'Audience Management', 'newspack-plugin' ),
				'desc'  => __( 'Engage your readers more deeply with tools to build customer relationships that drive towards sustainable revenue.', 'newspack-plugin' ),
				'cards' => array(
					array(
						'icon'  => 'settings',
						'title' => __( 'Configuration', 'newspack-plugin' ),
						'desc'  => __( 'Manage your Audience Management setup.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=newspack-audience' ),
					),
					array(
						'icon'  => 'megaphone',
						'title' => __( 'Campaigns', 'newspack-plugin' ),
						'desc'  => __( 'Coordinate prompts across your site to drive metrics.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=newspack-audience-campaigns' ),
					),
					array(
						'icon'  => 'gift',
						'title' => __( 'Donations', 'newspack-plugin' ),
						'desc'  => __( 'Bring in revenue through voluntary gifts.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=newspack-audience-donations' ),
					),
					array(
						'icon'  => 'payment',
						'title' => __( 'Subscriptions', 'newspack-plugin' ),
						'desc'  => __( 'Gate your site\'s content behind a paywall.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=newspack-audience-subscriptions' ),
					),
				),
			),
		);

		// Newspack Newsletters Plugin.
		if ( defined( 'NEWSPACK_NEWSLETTERS_PLUGIN_FILE' ) ) {
			$dashboard['newsletters'] = array(
				'title'        => __( 'Newsletters', 'newspack-plugin' ),
				'desc'         => __( 'Engage your readers directly in their email inbox.', 'newspack-plugin' ),
				'dependencies' => array(
					'newspack-newsletters',
				),
				'cards'        => array(
					array(
						'icon'  => 'envelope',
						'title' => __( 'All Newsletters', 'newspack-plugin' ),
						'desc'  => __( 'See all newsletters you\'ve sent out, and start new ones.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_nl_cpt' ),
					),
					array(
						'icon'  => 'pullquote',
						'title' => __( 'Advertising', 'newspack-plugin' ),
						'desc'  => __( 'Get advertising revenue from your newsletters.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_nl_ads_cpt' ),
					),
					array(
						'icon'  => 'tool',
						'title' => __( 'Settings', 'newspack-plugin' ),
						'desc'  => __( 'Configure tracking and other newsletter settings.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_nl_cpt&page=newspack-newsletters' ),
					),
				),
			);
		}

		$dashboard['advertising'] = array(
			'title'        => __( 'Advertising', 'newspack-plugin' ),
			'desc'         => __( 'Sell space on your site to fund your operations.', 'newspack-plugin' ),
			'dependencies' => array(
				'newspack-ads',
			),
			'cards'        => array(
				array(
					'icon'  => 'pullquote',
					'title' => __( 'Display Ads', 'newspack-plugin' ),
					'desc'  => __( 'Sell programmatic advertising on your site to drive revenue.', 'newspack-plugin' ),
					'href'  => admin_url( 'admin.php?page=newspack-ads-display-ads#/' ),
				),
				array(
					'icon'  => 'currencyDollar',
					'title' => __( 'Sponsors', 'newspack-plugin' ),
					'desc'  => __( 'Sell sponsored content directly to purchasers.', 'newspack-plugin' ),
					'href'  => admin_url( 'edit.php?post_type=newspack_spnsrs_cpt' ),
				),
			),
		);

		// Newspack Listings Plugin.
		if ( defined( 'NEWSPACK_LISTINGS_FILE' ) ) {
			$dashboard['listings'] = array(
				'title'        => __( 'Listings', 'newspack-plugin' ),
				'desc'         => __( 'Build databases of reusable or user-generated content to use on your site.', 'newspack-plugin' ),
				'dependencies' => array(
					'newspack-listings',
				),
				'cards'        => array(
					array(
						'icon'  => 'postDate',
						'title' => __( 'Events', 'newspack-plugin' ),
						'desc'  => __( 'Easily use the same event information across multiple posts.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_event' ),
					),
					array(
						'icon'  => 'store',
						'title' => __( 'Marketplace Listings', 'newspack-plugin' ),
						'desc'  => __( 'Allow users to list items and services for sale.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_mktplce' ),
					),
					array(
						'icon'  => 'postList',
						'title' => __( 'Generic Listing', 'newspack-plugin' ),
						'desc'  => __( 'Manage any structured data for use in posts.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_generic' ),
					),
					array(
						'icon'  => 'mapMarker',
						'title' => __( 'Places', 'newspack-plugin' ),
						'desc'  => __( 'Create a database of places in your coverage area.', 'newspack-plugin' ),
						'href'  => admin_url( 'edit.php?post_type=newspack_lst_place' ),
					),
					array(
						'icon'  => 'tool',
						'title' => __( 'Settings', 'newspack-plugin' ),
						'desc'  => __( 'Configure the way that Listings work on your site.', 'newspack-plugin' ),
						'href'  => admin_url( 'admin.php?page=newspack-listings-settings-admin' ),
					),
				),
			);
		}

		// Newspack Network Plugin.
		if ( is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			$dashboard['network'] = array(
				'title'        => __( 'Network', 'newspack-plugin' ),
				'desc'         => __( 'Manage the way your site\'s content flows across your publishing network.', 'newspack-plugin' ),
				'dependencies' => array(
					'newspack-network',
				),
				'cards'        => $this->get_dashboard_network_cards(),
			);
		}

		return $dashboard;
	}

	/**
	 * Get Newspack Network plugin dashboard cards.
	 *
	 * @return array Array of dashboard cards.
	 */
	public function get_dashboard_network_cards() {
		// Get the site role.
		$site_role = Network_Wizard::get_site_role();

		// Reusable card.
		$settings_card = array(
			'icon'  => 'tool',
			'title' => __( 'Settings', 'newspack-plugin' ),
			'desc'  => __( 'Configure how Newspack Network functions.', 'newspack-plugin' ),
			'href'  => admin_url( 'admin.php?page=newspack-network' ),
		);

		// If hub.
		if ( 'hub' === $site_role ) {
			return array(
				array(
					'icon'  => 'globe',
					'title' => __( 'Nodes', 'newspack-plugin' ),
					'desc'  => __( 'Manage which sites are part of your content network.', 'newspack-plugin' ),
					'href'  => admin_url( 'edit.php?post_type=newspack_hub_nodes' ),
				),
				array(
					'icon'  => 'rotateRight',
					'title' => __( 'Subscriptions', 'newspack-plugin' ),
					'desc'  => __( 'View all subscriptions across your network.', 'newspack-plugin' ),
					'href'  => admin_url( 'edit.php?post_type=np_hub_subscriptions' ),
				),
				array(
					'icon'  => 'currencyDollar',
					'title' => __( 'Orders', 'newspack-plugin' ),
					'desc'  => __( 'View all payments across your network.', 'newspack-plugin' ),
					'href'  => admin_url( 'edit.php?post_type=np_hub_orders' ),
				),
				array(
					'icon'  => 'formatListBullets',
					'title' => __( 'Event Log', 'newspack-plugin' ),
					'desc'  => __( 'Troubleshoot issues by viewing all events across your network.', 'newspack-plugin' ),
					'href'  => admin_url( 'admin.php?page=newspack-network-event-log' ),
				),
				$settings_card,
			);
		}

		// Node or no role.
		return array(
			$settings_card,
		);
	}

	/**
	 * Get Dashboard local data
	 *
	 * @return array Dashboard local data.
	 */
	public function get_local_data() {
		$site_name = get_bloginfo( 'name' );
		$theme_mods = get_theme_mods();
		$local_data = array(
			'settings'              => array(
				'siteName'      => $site_name,
				'headerBgColor' => $theme_mods['header_color_hex'] ?? '',
			),
			'sections'              => $this->get_dashboard(),
			'plugins'               => get_plugins(),
			'siteStatuses'          => array(
				'readerActivation' => array(
					'label'        => __( 'Audience Management', 'newspack-plugin' ),
					'statuses'     => array(
						'success' => __( 'Enabled', 'newspack-plugin' ),
						'error'   => __( 'Disabled', 'newspack-plugin' ),
					),
					'endpoint'     => '/newspack/v1/wizard/newspack-audience/audience-management',
					'configLink'   => admin_url( 'admin.php?page=newspack-audience#/' ),
					'dependencies' => array(
						'woocommerce' => array(
							'label'    => __( 'Woocommerce', 'newspack-plugin' ),
							'isActive' => is_plugin_active( 'woocommerce/woocommerce.php' ),
						),
					),
				),
				'googleAdManager'  => array(
					'label'            => __( 'Google Ad Manager', 'newspack-plugin' ),
					'statuses'         => array(
						'error-preflight' => __( 'Disconnected', 'newspack-plugin' ),
					),
					'endpoint'         => '/newspack/v1/wizard/billboard',
					'isPreflightValid' => ( new Newspack_Ads_Configuration_Manager() )->is_gam_connected(),
					'configLink'       => admin_url( 'admin.php?page=newspack-ads-display-ads' ),
					'dependencies'     => array(
						'newspack-ads' => array(
							'label'    => __( 'Newspack Ads', 'newspack-plugin' ),
							'isActive' => is_plugin_active( 'newspack-ads/newspack-ads.php' ),
						),
					),
				),
				'googleAnalytics'  => array(
					'label'        => __( 'Google Analytics', 'newspack-plugin' ),
					'endpoint'     => '/google-site-kit/v1/modules/analytics-4/data/settings',
					'configLink'   => in_array( 'analytics', get_option( 'googlesitekit_active_modules', array() ), true ) ?
						admin_url( 'admin.php?page=googlesitekit-settings#/connected-services/analytics-4' ) :
						admin_url( 'admin.php?page=googlesitekit-splash' ),
					'dependencies' => array(
						'google-site-kit' => array(
							'label'    => __( 'Google Site Kit', 'newspack-plugin' ),
							'isActive' => is_plugin_active( 'google-site-kit/google-site-kit.php' ),
						),
					),
				),
			),
			'quickActions'          => array(),
			'availableQuickActions' => array(),
		);

		/**
		 * User's saved quick action preferences.
		 *
		 * @var array|false
		 */
		$saved_quick_actions = get_user_meta( get_current_user_id(), 'newspack_quick_actions', true );

		/**
		 * All available quick actions that can be configured by the user.
		 *
		 * @var array
		 */
		$available_actions = array(
			array(
				'href'  => admin_url( 'post-new.php' ),
				'title' => __( 'Start a new post', 'newspack-plugin' ),
				'icon'  => 'post',
				'id'    => 'new-post',
			),
		);

		if ( defined( 'NEWSPACK_NEWSLETTERS_PLUGIN_FILE' ) ) {
			$available_actions[] = array(
				'href'  => admin_url( 'post-new.php?post_type=newspack_nl_cpt' ),
				'title' => __( 'Draft a newsletter', 'newspack-plugin' ),
				'icon'  => 'envelope',
				'id'    => 'new-newsletter',
			);
		}

		$available_actions = array_merge(
			$available_actions,
			array(
				array(
					'href'  => 'https://lookerstudio.google.com/u/0/reporting/b7026fea-8c2c-4c4b-be95-f582ed94f097/page/p_3eqlhk5odd',
					'title' => __( 'Open data dashboard', 'newspack-plugin' ),
					'icon'  => 'chartBar',
					'id'    => 'data-dashboard',
				),
				array(
					'href'  => admin_url( 'edit.php' ),
					'title' => __( 'View all posts', 'newspack-plugin' ),
					'icon'  => 'postList',
					'id'    => 'view-posts',
				),
				array(
					'href'  => admin_url( 'admin.php?page=newspack-audience-campaigns#/campaigns' ),
					'title' => __( 'Manage campaigns', 'newspack-plugin' ),
					'icon'  => 'megaphone',
					'id'    => 'manage-campaigns',
				),
				array(
					'href'  => admin_url( 'admin.php?page=newspack-ads-display-ads' ),
					'title' => __( 'Manage advertising', 'newspack-plugin' ),
					'icon'  => 'pullquote',
					'id'    => 'manage-ads',
				),
			)
		);

		if ( $saved_quick_actions && is_array( $saved_quick_actions ) ) {
			// Reorder available actions based on saved preferences.
			$ordered_actions = array();
			foreach ( $saved_quick_actions as $action_id ) {
				foreach ( $available_actions as $action ) {
					if ( $action['id'] === $action_id ) {
						$ordered_actions[] = $action;
						break;
					}
				}
			}
			$local_data['quickActions'] = $ordered_actions;
		} else {
			// Default to first 3 actions if no preferences saved.
			$local_data['quickActions'] = array_slice( $available_actions, 0, 3 );
		}

		$local_data['availableQuickActions'] = $available_actions;

		return $local_data;
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html_x( 'Newspack', 'Plugin name', 'newspack' );
	}

	/**
	 * Add a parent menu for Newspack and the first submenu item.
	 */
	public function add_page() {
		$icon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMjIgMTJjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMFMyIDE3LjUyMyAyIDEyIDYuNDc3IDIgMTIgMnMxMCA0LjQ3NyAxMCAxMFptLTUuNDU1IDQuNTQ2LTkuMDktOS4wOTF2OS4wOWgxLjgxOHYtNC42OTdsNC42OTcgNC42OTdoMi41NzVabS01LjE1MS03LjcyOGg1LjE1MlY3LjQ1NUgxMC4wM2wxLjM2NCAxLjM2M1ptNS4xNTIgMi41NzZIMTMuOTdsLTEuMzY0LTEuMzY0aDMuOTR2MS4zNjRabTAgMS4yMTJ2MS4zNjRsLTEuMzY0LTEuMzY0aDEuMzY0WiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+';
		add_menu_page(
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			array( $this, 'render_wizard' ),
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
			array( $this, 'render_wizard' )
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

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		add_action( 'rest_api_init', array( $this, 'register_api_endpoints' ) );
	}

	/**
	 * Register the REST API endpoints.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			'wp/v2/newspack',
			'/quick-actions',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_quick_action_preferences' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
			)
		);
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool|WP_Error
	 */
	public function api_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				esc_html__( 'You cannot use this resource.', 'newspack-plugin' ),
				array(
					'status' => 403,
				)
			);
		}
		return true;
	}

	/**
	 * Save user's quick action preferences.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function save_quick_action_preferences( $request ) {
		$action_ids = $request->get_json_params();
		if ( ! is_array( $action_ids ) ) {
			return new \WP_Error(
				'newspack_invalid_data',
				esc_html__( 'Invalid data format.', 'newspack-plugin' ),
				array(
					'status' => 400,
				)
			);
		}

		update_user_meta( get_current_user_id(), 'newspack_quick_actions', $action_ids );
		return rest_ensure_response( array( 'success' => true ) );
	}
}
