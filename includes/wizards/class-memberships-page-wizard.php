<?php
/**
 * Newspack Memberships landing page setup.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

const NEWSPACK_MEMBERSHIPS_PAGE_ID_OPTION = 'newspack_memberships_page_id';

/**
 * Guided setup of a memberships landing page.
 */
class Memberships_Page_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-memberships-page-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'edit_posts';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Customize your memberships page', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Create a memberships page that converts.', 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '20 minutes', 'newspack' );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		/*
		// Get whether adsense is configured or not.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/adsense-setup-complete',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_adsense_setup_complete' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);*/
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/memberships-page',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_memberships_page' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/create-memberships-page',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_create_memberships_page' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	public function api_get_memberships_page() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}

		return rest_ensure_response( $this->get_memberships_page_info() );
	}

	public function api_create_memberships_page() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}

		$page_id = $this->create_memberships_page();
		if ( is_wp_error( $page_id ) ) {
			return rest_ensure_response( $page_id );
		}

		$this->set_memberships_page( $page_id );
		return rest_ensure_response( $this->get_memberships_page_info( $page_id ) );
	}

	protected function create_memberships_page() {
		$subscriptions = wc_get_products(
			[
				'limit'                           => -1,
				'only_get_newspack_subscriptions' => true,
			]
		);

		$intro_content = __( 'Quality journalism is not possible without you. Join now to help keep our mission going!');
		$button_text = __( 'Join' );
		$intro_block = '
			<!-- wp:paragraph -->
				<p>%s</p>
			<!-- /wp:paragraph -->';

		$featured_product_block = '
			<!-- wp:woocommerce/featured-product {"editMode":false,"productId":%d,"align":"full"} -->
				<!-- wp:button {"align":"center"} -->
					<div class="wp-block-button aligncenter"><a class="wp-block-button__link" href="%s">%s</a></div>
				<!-- /wp:button -->
			<!-- /wp:woocommerce/featured-product -->';

		$content = sprintf( $intro_block, $intro_content );
		foreach ( $subscriptions as $subscription ) {
			$content .= sprintf( $featured_product_block, $subscription->get_id(), $subscription->get_permalink(), $button_text );
		}

		$page_args = [
			'post_type' => 'page',
			'post_title' => __( 'Memberships', 'newspack' ),
			'post_content' => $content,
			'post_excerpt' => __( 'Support quality journalism by becoming a member today!', 'newspack' ),
			'post_status' => 'draft',
			'comment_status' => 'closed',
			'ping_status' => 'closed',
		];
		return wp_insert_post( $page_args );
	}

	protected function set_memberships_page( $page_id ) {
		update_option( NEWSPACK_MEMBERSHIPS_PAGE_ID_OPTION, $page_id );
	}

	protected function get_memberships_page_info( $page_id = 0 ) {
		if ( ! $page_id ) {
			$page_id = get_option( NEWSPACK_MEMBERSHIPS_PAGE_ID_OPTION, 0 );
		}
		if ( ! $page_id || 'page' !== get_post_type( $page_id ) ) {
			return false;
		}

		return [
			'id' => $page_id,
			'url' => get_permalink( $page_id ),
			'editUrl' => html_entity_decode( get_edit_post_link( $page_id ) ),
			'status' => get_post_status( $page_id ),
		];
	}

	/**
	 * Check whether the WC plugins are installed and active.
	 *
	 * @return bool | WP_Error True on success, WP_Error on failure.
	 */
	protected function check_required_plugins_installed() {
		if ( ! function_exists( 'WC' ) || ! class_exists( 'WC_Subscriptions_Product' ) || ! class_exists( 'WC_Name_Your_Price_Helpers' ) ) {
			return new WP_Error(
				'newspack_missing_required_plugin',
				esc_html__( 'The required plugins are not installed and activated. Install and/or activate them to access this feature.', 'newspack' ),
				[
					'status' => 400,
					'level'  => 'fatal',
				]
			);
		}
		return true;
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();
		wp_enqueue_media();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-memberships-page-wizard',
			Newspack::plugin_url() . '/assets/dist/membershipsPage.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/membershipsPage.js' ),
			true
		);

		wp_register_style(
			'newspack-memberships-page-wizard',
			Newspack::plugin_url() . '/assets/dist/membershipsPage.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/membershipsPage.css' )
		);
		wp_style_add_data( 'newspack-memberships-page-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-memberships-page-wizard' );
	}
}
