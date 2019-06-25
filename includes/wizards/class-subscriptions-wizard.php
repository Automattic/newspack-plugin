<?php
/**
 * Newspack subscriptions setup and management.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error, \WC_Subscriptions_Product, \WC_Product_Simple, \WC_Product_Subscription, \WC_Name_Your_Price_Helpers;
defined( 'ABSPATH' ) || exit;
require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';
/**
 * Easy interface for managing subscriptions.
 */
class Subscriptions_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-subscriptions-wizard';
	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'edit_products';
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
		add_filter( 'woocommerce_product_data_store_cpt_get_products_query', [ $this, 'handle_only_get_newspack_subscriptions_query' ], 10, 2 );
	}
	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Subscriptions', 'newspack' );
	}
	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Create and manage subscription plans for consistent memberships revenue', 'newspack' );
	}
	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '10 minutes', 'newspack' );
	}
	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		// Get all Newspack subscriptions.
		register_rest_route(
			'newspack/v1/wizard/',
			'/subscriptions/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_subscriptions' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		// Get one subscription.
		register_rest_route(
			'newspack/v1/wizard/',
			'/subscriptions/(?P<id>\d+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_subscription' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id' => [
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
		// Save a subscription.
		register_rest_route(
			'newspack/v1/wizard/',
			'/subscriptions/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_save_subscription' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id'        => [
						'sanitize_callback' => 'absint',
					],
					'image'     => [
						'sanitize_callback' => 'absint',
					],
					'name'      => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'price'     => [
						'sanitize_callback' => 'wc_format_decimal',
					],
					'frequency' => [
						'sanitize_callback' => 'sanitize_title',
					],
				],
			]
		);
		// Delete a subscription.
		register_rest_route(
			'newspack/v1/wizard/',
			'/subscriptions/(?P<id>\d+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ $this, 'api_delete_subscription' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id' => [
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
		// Get NYP status.
		register_rest_route(
			'newspack/v1/wizard/',
			'/subscriptions/choose-price/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_choose_price' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		// Enable/Disable NYP for Newspack subscriptions.
		register_rest_route(
			'newspack/v1/wizard/',
			'/subscriptions/choose-price/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_set_choose_price' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'enabled' => [
						'sanitize_callback' => 'wc_string_to_bool',
					],
				],
			]
		);
	}
	/**
	 * Check whether required lugins are installed and active.
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
	 * Get the Newspack subscriptions.
	 *
	 * @return WP_REST_Response containing subscriptions info.
	 */
	public function api_get_subscriptions() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		$products = wc_get_products(
			[
				'limit'                           => -1,
				'only_get_newspack_subscriptions' => true,
			]
		);
		$response = [];
		foreach ( $products as $product ) {
			$response[] = $this->get_product_data_for_api( $product );
		}
		return rest_ensure_response( $response );
	}
	/**
	 * Get one subscription.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response containing subscription info.
	 */
	public function api_get_subscription( $request ) {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		$params  = $request->get_params();
		$id      = $params['id'];
		$product = wc_get_product( $params['id'] );
		if ( ! $product ) {
			return new WP_Error(
				'newspack_rest_invalid_product',
				esc_html__( 'Resource does not exist.', 'newspack' ),
				[
					'status' => 404,
				]
			);
		}
		return rest_ensure_response( $this->get_product_data_for_api( $product ) );
	}
	/**
	 * Get information about one product, suitable for the API.
	 *
	 * @param WC_Product $product Product to get info for.
	 * @return array of information about the product.
	 */
	protected function get_product_data_for_api( $product ) {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		return [
			'id'            => $product->get_id(),
			'name'          => $product->get_name(),
			'price'         => $product->get_regular_price(),
			'display_price' => wp_strip_all_tags( html_entity_decode( $product->get_price_html() ) ),
			'url'           => $product->get_permalink(),
			'frequency'     => WC_Subscriptions_Product::get_period( $product ) ? WC_Subscriptions_Product::get_period( $product ) : 'once',
			'image'         => [
				'id'  => $product->get_image_id(),
				'url' => $product->get_image_id() ? current( wp_get_attachment_image_src( $product->get_image_id(), 'woocommerce_thumbnail' ) ) : wc_placeholder_img_src( 'woocommerce_thumbnail' ),
			],
		];
	}
	/**
	 * Save a subscription.
	 *
	 * @param WP_REST_Request $request Product info.
	 * @return WP_REST_Response Updated product info.
	 */
	public function api_save_subscription( $request ) {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		$params   = $request->get_params();
		$defaults = [
			'id'        => 0,
			'name'      => '',
			'image_id'  => 0,
			'price'     => 0.0,
			'frequency' => 'once',
		];
		$args     = wp_parse_args( $params, $defaults );
		if ( 'once' === $args['frequency'] ) {
			$product = new \WC_Product_Simple( $args['id'] );
		} else {
			$product = new \WC_Product_Subscription( $args['id'] );
		}
		$product->set_name( $args['name'] );
		$product->set_virtual( true );
		$product->set_image_id( $args['image_id'] );
		$product->set_regular_price( $args['price'] );
		// Set one-page checkout 'on' for this product.
		$product->update_meta_data( '_wcopc', 'yes' );
		// Set 'Name your price' settings.
		$product->update_meta_data( '_suggested_price', $args['price'] );
		$product->update_meta_data( '_hide_nyp_minimum', 'yes' );
		$product->update_meta_data( '_min_price', wc_format_decimal( 1.0 ) );
		if ( $this->get_choose_price() ) {
			$product->update_meta_data( '_nyp', 'yes' );
		}
		// Mark product as created through the Subscription Wizard.
		$product->update_meta_data( 'newspack_created_subscription', 1 );
		// Add subscription info.
		if ( 'once' !== $args['frequency'] ) {
			$product->update_meta_data( '_subscription_price', wc_format_decimal( $args['price'] ) );
			$product->update_meta_data( '_subscription_period', 'month' === $args['frequency'] ? 'month' : 'year' );
			$product->update_meta_data( '_subscription_period_interval', 1 );
		}
		$product->save();
		return rest_ensure_response( $this->get_product_data_for_api( $product ) );
	}
	/**
	 * Delete a subscription.
	 *
	 * @param WP_REST_Request $request Request with ID of product to delete.
	 * @return WP_REST_Response Boolean delete success.
	 */
	public function api_delete_subscription( $request ) {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		$params  = $request->get_params();
		$id      = $params['id'];
		$product = wc_get_product( $params['id'] );
		if ( ! $product ) {
			return rest_ensure_response( false );
		}
		return rest_ensure_response( $product->delete( true ) );
	}
	/**
	 * Get whether choose price is enabled through the API.
	 *
	 * @return WP_REST_Response Boolean whether it's enabled.
	 */
	public function api_get_choose_price() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		return rest_ensure_response( $this->get_choose_price() );
	}
	/**
	 * Get whether choose price is enabled.
	 *
	 * @return bool
	 */
	protected function get_choose_price() {
		// Check one product to determine whether NYP is enabled, and generalize to all products.
		$products = wc_get_products(
			[
				'limit'                           => 1,
				'only_get_newspack_subscriptions' => true,
			]
		);
		if ( empty( $products ) ) {
			return false;
		}
		return (bool) WC_Name_Your_Price_Helpers::is_nyp( $products[0] );
	}
	/**
	 * Set choose price to true/false for all Newspack subscriptions.
	 *
	 * @param WP_REST_Request $request Enable or disable.
	 * @return WP_REST_Response The updated setting.
	 */
	public function api_set_choose_price( $request ) {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		$params   = $request->get_params();
		$enabled  = $params['enabled'];
		$setting  = $enabled ? 'yes' : '';
		$products = wc_get_products(
			[
				'limit'                           => -1,
				'only_get_newspack_subscriptions' => true,
			]
		);
		foreach ( $products as $product ) {
			$product->update_meta_data( '_nyp', $setting );
			$product->save();
		}
		return $this->api_get_choose_price();
	}
	/**
	 * Hook into wc_get_products to handle filtering by only products created through the Newspack Subscriptions Wizard.
	 *
	 * @param array $query WP_Query args.
	 * @param array $query_vars Args passed into wc_get_products.
	 */
	public function handle_only_get_newspack_subscriptions_query( $query, $query_vars ) {
		if ( ! empty( $query_vars['only_get_newspack_subscriptions'] ) ) {
			$query['meta_query'][] = [
				'key'   => 'newspack_created_subscription',
				'value' => 1,
			];
		}
		return $query;
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
			'newspack-subscriptions-wizard',
			Newspack::plugin_url() . '/assets/dist/subscriptions.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/subscriptions.js' ),
			true
		);
		wp_register_style(
			'newspack-subscriptions-wizard',
			Newspack::plugin_url() . '/assets/dist/subscriptions.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/subscriptions.css' )
		);
		wp_style_add_data( 'newspack-subscriptions-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-subscriptions-wizard' );
	}
}
