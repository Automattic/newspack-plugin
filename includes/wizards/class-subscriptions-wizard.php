<?php
/**
 * Newspack subscriptions setup and management.
 *
 * @package Newspack
 */

namespace Newspack;

use \WC_Subscriptions_Product;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for managing subscriptions.
 */
class Subscriptions_Wizard extends Wizard {

	/**
	 * The name of this wizard.
	 *
	 * @var string
	 */
	protected $name = 'Subscriptions';

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

	public function __construct() {
		parent::__construct();

		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	public function register_api_endpoints() {
		register_rest_route( 'newspack/v1/wizard/', '/subscriptions/', [
			'methods' => 'GET',
			'callback' => [ $this, 'get_subscriptions' ],
			'permission_callback' => [ $this, 'api_permissions_check' ],
		] );
	}

	public function get_subscriptions( $request ) {
		$products = wc_get_products( [
			'limit' => -1,
		] );

		$response = [];

		foreach ( $products as $product ) {
			$response[] = [
				'id' => $product->get_id(),
				'name' => $product->get_name(),
				'price' => wp_strip_all_tags( html_entity_decode( $product->get_price_html() ) ),
				'image' => $product->get_image_id() ? current( wp_get_attachment_image_src( $product->get_image_id(), 'woocommerce_thumbnail' ) ) : wc_placeholder_img_src( 'woocommerce_thumbnail' ),
				'url' => $product->get_permalink(),
			];
		}

		return rest_ensure_response( $response );
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
new Subscriptions_Wizard();
