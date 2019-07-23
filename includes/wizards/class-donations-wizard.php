<?php
/**
 * Newspack donations setup and management.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error, \WC_Subscriptions_Product, \WC_Product_Simple, \WC_Product_Subscription, \WC_Name_Your_Price_Helpers;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for managing donations.
 */
class Donations_Wizard extends Wizard {

	const DONATION_PRODUCT_ID_OPTION = 'newspack_donation_product_id';
	const DONATION_SUGGESTED_AMOUNT_META = 'newspack_donation_suggested_amount';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-donations-wizard';

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
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Donations', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( "Set up and manage reader donations for consistent, predictable revenue", 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '2 minutes', 'newspack' );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		// Get all Newspack subscriptions.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/donation/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_donation_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Save a subscription.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/donation/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_set_donation_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'image'     => [
						'sanitize_callback' => 'absint',
					],
					'name'      => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'suggestedAmount'     => [
						'sanitize_callback' => 'wc_format_decimal',
					]
				],
			]
		);
	}

	/**
	 * Check whether required plugins are installed and active.
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
	 * API endpoint for getting donation settings.
	 *
	 * @return WP_REST_Response containing info.
	 */
	public function api_get_donation_settings() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}

		return rest_ensure_response( self::get_donation_settings() );
	}

	/**
	 * Get the donation settings.
	 *
	 * @return Array of dontion settings (See $settings at the top of the method for format).
	 */
	public static function get_donation_settings() {
		$settings = [
			'name' => '',
			'suggestedAmount' => 15.00,
			'image' => false,
		];

		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );
		if ( ! $product_id ) {
			return $settings;
		}

		$product = \wc_get_product( $product_id );
		if ( ! $product || 'grouped' !== $product->get_type() ) {
			return $settings;
		}

		$settings['name'] = $product->get_name();
		$settings['image'] = [
			'id'  => $product->get_image_id(),
			'url' => $product->get_image_id() ? current( wp_get_attachment_image_src( $product->get_image_id(), 'woocommerce_thumbnail' ) ) : wc_placeholder_img_src( 'woocommerce_thumbnail' ),
		];

		$suggested_donation = $product->get_meta( self::DONATION_SUGGESTED_AMOUNT_META, true );
		if ( $suggested_donation ) {
			$settings['suggestedAmount'] = floatval( $suggested_donation );	
		}

		return $settings;
	}

	/**
	 * API endpoint for setting the donation settings.
	 *
	 * @param WP_REST_Request $request Request containing settings.
	 * @return WP_REST_Response with the latest settings.
	 */
	public function api_set_donation_settings( $request ) {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}
		return rest_ensure_response( self::set_donation_settings( $request->get_params() ) );
	}

	/**
	 * Set the donation settings.
	 *
	 * @param array $args Array of settings info. See $defaults at top of this method for format.
	 * @return array Updated settings.
	 */
	public static function set_donation_settings( $args ) {
		$defaults = [
			'name' => '',
			'suggestedAmount' => 0,
			'image_id' => 0,
		];
		$args = wp_parse_args( $args, $defaults );

		// Create the product if it hasn't been created yet.
		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );
		if ( ! $product_id ) {
			self::create_donation_product( $args );
			return self::get_donation_settings();
		}

		// Re-create the product if the data is corrupted.
		$product = \wc_get_product( $product_id );
		if ( ! $product || 'grouped' !== $product->get_type() ) {
			self::create_donation_product( $args );
			return self::get_donation_settings();
		}

		// Update the existing product.
		self::update_donation_product( $args );
		return self::get_donation_settings();
	}

	/**
	 * Create new donations products.
	 *
	 * @param array $args Info that will be used to create the products. See $defaults at top of this method for format.
	 */
	protected static function create_donation_product( $args ) {
		$defaults = [
			'name' => '',
			'suggestedAmount' => 0,
			'image_id' => 0,
		];
		$args = wp_parse_args( $args, $defaults );

		// Parent product.
		$parent_product = new \WC_Product_Grouped();
		$parent_product->set_name( $args['name'] );
		if ( $args['image_id'] ) {
			$parent_product->set_image_id( $args['image_id'] );
		}
		$parent_product->update_meta_data( self::DONATION_SUGGESTED_AMOUNT_META, floatval( $args['suggestedAmount'] ) );

		// Monthly donation.
		$monthly_product = new \WC_Product_Subscription();
		/* translators: %s: Product name */
		$monthly_product->set_name( sprintf( __( '%s: Monthly', 'newspack' ), $args['name'] ) );
		if ( $args['image_id'] ) {
			$monthly_product->set_image_id( $args['image_id'] );
		}
		$monthly_product->set_regular_price( $args['suggestedAmount'] );
		$monthly_product->update_meta_data( '_suggested_price', $args['suggestedAmount'] );
		$monthly_product->update_meta_data( '_hide_nyp_minimum', 'yes' );
		$monthly_product->update_meta_data( '_min_price', wc_format_decimal( 1.0 ) );
		$monthly_product->update_meta_data( '_nyp', 'yes' );
		$monthly_product->update_meta_data( '_subscription_price', wc_format_decimal( $args['suggestedAmount'] ) );
		$monthly_product->update_meta_data( '_subscription_period', 'month' );
		$monthly_product->update_meta_data( '_subscription_period_interval', 1 );
		$monthly_product->save();

		// Yearly donation.
		$yearly_product = new \WC_Product_Subscription();
		/* translators: %s: Product name */
		$yearly_product->set_name( sprintf( __( '%s: Yearly', 'newspack' ), $args['name'] ) );
		if ( $args['image_id'] ) {
			$yearly_product->set_image_id( $args['image_id'] );
		}
		$yearly_product->set_regular_price( 12 * $args['suggestedAmount'] );
		$yearly_product->update_meta_data( '_suggested_price', 12 * $args['suggestedAmount'] );
		$yearly_product->update_meta_data( '_hide_nyp_minimum', 'yes' );
		$yearly_product->update_meta_data( '_min_price', wc_format_decimal( 1.0 ) );
		$yearly_product->update_meta_data( '_nyp', 'yes' );
		$yearly_product->update_meta_data( '_subscription_price', wc_format_decimal( 12 * $args['suggestedAmount'] ) );
		$yearly_product->update_meta_data( '_subscription_period', 'year' );
		$yearly_product->update_meta_data( '_subscription_period_interval', 1 );
		$yearly_product->save();

		// One-time donation.
		$once_product = new \WC_Product_Simple();
		/* translators: %s: Product name */
		$once_product->set_name( sprintf( __( '%s: One-Time', 'newspack' ), $args['name'] ) );
		if ( $args['image_id'] ) {
			$once_product->set_image_id( $args['image_id'] );
		}
		$once_product->set_regular_price( $args['suggestedAmount'] );
		$once_product->update_meta_data( '_suggested_price', $args['suggestedAmount'] );
		$once_product->update_meta_data( '_hide_nyp_minimum', 'yes' );
		$once_product->update_meta_data( '_min_price', wc_format_decimal( 1.0 ) );
		$once_product->update_meta_data( '_nyp', 'yes' );
		$once_product->save();

		$parent_product->set_children( [
			$monthly_product->get_id(),
			$yearly_product->get_id(),
			$once_product->get_id(),
		] );
		$parent_product->save();
		update_option( self::DONATION_PRODUCT_ID_OPTION, $parent_product->get_id() );
	}

	/**
	 * Update the donations products.
	 *
	 * @param string $args Donations settings. See $defaults at top of this method for more info.
	 */
	protected static function update_donation_product( $args ) {
		$defaults = [
			'name' => '',
			'suggestedAmount' => 0,
			'image_id' => 0,
		];
		$args = wp_parse_args( $args, $defaults );
		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );
		$parent_product = \wc_get_product( $product_id );

		$parent_product->set_name( $args['name'] );
		$parent_product->set_image_id( $args['image_id'] );
		$parent_product->update_meta_data( self::DONATION_SUGGESTED_AMOUNT_META, floatval( $args['suggestedAmount'] ) );
		$parent_product->set_status( 'publish' );
		$parent_product->save();

		foreach ( $parent_product->get_children() as $child_id ) {
			$child_product = \wc_get_product( $child_id );
			if ( ! $child_product ) {
				continue;
			}

			$child_product->set_status( 'publish' );
			$child_product->set_image_id( $args['image_id'] );
			$child_product->set_regular_price( $args['suggestedAmount'] );
			$child_product->update_meta_data( '_suggested_price', $args['suggestedAmount'] );
			if ( 'subscription' === $child_product->get_type() ) {
				if ( 'year' === $child_product->get_meta( '_subscription_period', true ) ) {
					/* translators: %s: Product name */
					$child_product->set_name( sprintf( __( '%s: Yearly', 'newspack' ), $args['name'] ) );
					$yearly_price = 12 * $args['suggestedAmount'];
					$child_product->update_meta_data( '_subscription_price', \wc_format_decimal( $yearly_price ) );
					$child_product->update_meta_data( '_suggested_price', \wc_format_decimal( $yearly_price ) );
					$child_product->set_regular_price( $yearly_price );
				} else {
					/* translators: %s: Product name */
					$child_product->set_name( sprintf( __( '%s: Monthly', 'newspack' ), $args['name'] ) );
					$child_product->update_meta_data( '_subscription_price', wc_format_decimal( $args['suggestedAmount'] ) );
				}
			} else {
				/* translators: %s: Product name */
				$child_product->set_name( sprintf( __( '%s: One-Time', 'newspack' ), $args['name'] ) );
			}
			$child_product->save();
		}
	}

	/**
	 * Enqueue Donations Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();
		wp_enqueue_media();
		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}
		wp_enqueue_script(
			'newspack-donations-wizard',
			Newspack::plugin_url() . '/assets/dist/donations.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/donations.js' ),
			true
		);
		wp_register_style(
			'newspack-donations-wizard',
			Newspack::plugin_url() . '/assets/dist/donations.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/donations.css' )
		);
		wp_style_add_data( 'newspack-donations-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-donations-wizard' );
	}
}
