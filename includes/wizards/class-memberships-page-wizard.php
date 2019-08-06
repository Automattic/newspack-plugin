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

	/**
	 * Get information about the memberships page, if set up.
	 *
	 * @return WP_REST_Response with memberships page info.
	 */
	public function api_get_memberships_page() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}

		return rest_ensure_response( $this->get_memberships_page_info() );
	}

	/**
	 * Create the memberships page.
	 *
	 * @return WP_REST_Response with memberships page info.
	 */
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

	/**
	 * Create the memberships page prepopulated with CTAs for the subscriptions.
	 *
	 * @return int Post ID of page.
	 */
	protected function create_memberships_page() {
		$revenue_model = Reader_Revenue_Onboarding_Wizard::get_revenue_model();

		$intro           = esc_html__( 'With the support of readers like you, we provide thoughtfully researched articles for a more informed and connected community. This is your chance to support credible, community-based, public-service journalism. Please join us!', 'newspack' );
		$content_heading = esc_html__( 'Membership', 'newspack' );
		$content         = esc_html__( "Edit and add to this content to tell your publication's story and explain the benefits of becoming a member. This is a good place to mention any special member privileges, let people know that donations are tax-deductible, or provide any legal information.", 'newspack' );

		$intro_block           = '
			<!-- wp:paragraph -->
				<p>%s</p>
			<!-- /wp:paragraph -->';
		$content_heading_block = '
			<!-- wp:heading -->
				<h2>%s</h2>
			<!-- /wp:heading -->';
		$content_block         = '
			<!-- wp:paragraph -->
				<p>%s</p>
			<!-- /wp:paragraph -->';

		$page_content = sprintf( $intro_block, $intro );
		if ( 'donations' === $revenue_model ) {
			$page_content .= $this->get_donations_block();
		} elseif ( 'subscriptions' === $revenue_model ) {
			$page_content .= $this->get_subscriptions_block();
		}
		$page_content .= sprintf( $content_heading_block, $content_heading );
		$page_content .= sprintf( $content_block, $content );

		$page_args = [
			'post_type'      => 'page',
			'post_title'     => __( 'Support our publication', 'newspack' ),
			'post_content'   => $page_content,
			'post_excerpt'   => __( 'Support quality journalism by joining us today!', 'newspack' ),
			'post_status'    => 'draft',
			'comment_status' => 'closed',
			'ping_status'    => 'closed',
		];
		return wp_insert_post( $page_args );
	}

	/**
	 * Get raw content for a pre-populated WC featured product block featuring subscriptions.
	 *
	 * @return string Raw block content.
	 */
	protected function get_subscriptions_block() {
		$button_text   = __( 'Join', 'newspack' );
		$subscriptions = wc_get_products(
			[
				'limit'                           => -1,
				'only_get_newspack_subscriptions' => true,
				'return'                          => 'ids',
			]
		);
		$num_products  = count( $subscriptions );
		if ( ! $num_products ) {
			return '';
		}

		$id_list = esc_attr( implode( ',', $subscriptions ) );

		$block_format = '
		<!-- wp:woocommerce/handpicked-products {"columns":%d,"editMode":false,"contentVisibility":{"title":true,"price":true,"rating":false,"button":true},"orderby":"price_asc","products":[%s]} -->
			<div class="wp-block-woocommerce-handpicked-products is-hidden-rating">[products limit="%d" columns="%d" orderby="price" order="ASC" ids="%s"]</div>
		<!-- /wp:woocommerce/handpicked-products -->';

		$block = sprintf( $block_format, $num_products, $id_list, $num_products, $num_products, $id_list );
		return $block;
	}

	/**
	 * Get raw content for a pre-populated Newspack Donations block.
	 *
	 * @return string Raw block content.
	 */
	protected function get_donations_block() {
		$block = '<!-- wp:newspack-blocks/donate /-->';
		return $block;
	}

	/**
	 * Set the memberships page.
	 *
	 * @param int $page_id The post ID of the memberships page.
	 */
	protected function set_memberships_page( $page_id ) {
		update_option( NEWSPACK_MEMBERSHIPS_PAGE_ID_OPTION, $page_id );
	}

	/**
	 * Get info about the memberships page.
	 *
	 * @param int $page_id Optional ID of page to get info for. Default: saved memberships page.
	 * @return array|bool Array of info, or false if page is not created.
	 */
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
	 * Enqueue scripts and styles.
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
