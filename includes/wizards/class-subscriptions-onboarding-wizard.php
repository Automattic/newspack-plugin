<?php
/**
 * Newspack address/payments/api keys/etc. setup.
 *
 * @package Newspack
 */

namespace Newspack;

use \WC_Install, \WC_Payment_Gateways;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up general store info.
 */
class Subscriptions_Onboarding_Wizard extends Wizard {

	/**
	 * The name of this wizard.
	 *
	 * @var string
	 */
	protected $name = 'Subscriptions Onboarding';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-subscriptions-onboarding-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		// Get fields for options.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/fields',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_fields' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Get location info.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/location/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_location' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Save location info.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/location/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_save_location' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'countrystate' => [
						'sanitize_callback' => 'wc_clean',
					],
					'address1'     => [
						'sanitize_callback' => 'wc_clean',
					],
					'address2'     => [
						'sanitize_callback' => 'wc_clean',
					],
					'city'         => [
						'sanitize_callback' => 'wc_clean',
					],
					'postcode'     => [
						'sanitize_callback' => 'wc_clean',
					],
					'currency'     => [
						'sanitize_callback' => 'wc_clean',
					],
				],
			]
		);

		// Get Stripe info.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/stripe-settings/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_stripe_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Save Stripe info.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/stripe-settings/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_save_stripe_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'enabled'            => [
						'sanitize_callback' => 'wc_string_to_bool',
					],
					'testMode'           => [
						'sanitize_callback' => 'wc_string_to_bool',
					],
					'publishableKey'     => [
						'sanitize_callback' => 'wc_clean',
					],
					'secretKey'          => [
						'sanitize_callback' => 'wc_clean',
					],
					'testPublishableKey' => [
						'sanitize_callback' => 'wc_clean',
					],
					'testSecretKey'      => [
						'sanitize_callback' => 'wc_clean',
					],
				],
			]
		);

	}

	/**
	 * Get information for populating dropdown menus.
	 *
	 * @return WP_REST_Response containing info.
	 */
	public function api_get_fields() {
		$countries     = WC()->countries->get_countries();
		$states        = WC()->countries->get_states();
		$location_info = [];
		foreach ( $countries as $country_code => $country ) {
			if ( isset( $states[ $country_code ] ) ) {
				foreach ( $states[ $country_code ] as $state_code => $state ) {
					$location_info[] = [
						'value' => $country_code . ':' . $state_code,
						'label' => html_entity_decode( $country . ' – ' . $state ),
					];
				}
			} else {
				$location_info[] = [
					'value' => $country_code,
					'label' => html_entity_decode( $country ),
				];
			}
		}

		$currencies    = get_woocommerce_currencies();
		$currency_info = [];
		foreach ( $currencies as $code => $currency ) {
			$currency_info[] = [
				'value' => $code,
				'label' => html_entity_decode( $currency ),
			];
		}

		return rest_ensure_response(
			[
				'countrystate' => $location_info,
				'currency'     => $currency_info,
			]
		);
	}

	/**
	 * Get location info.
	 *
	 * @return WP_REST_Response containing info.
	 */
	public function api_get_location() {
		$countrystate_raw = wc_get_base_location();
		$location         = [
			'countrystate' => '*' === $countrystate_raw['state'] ? $countrystate_raw['country'] : $countrystate_raw['country'] . ':' . $countrystate_raw['state'],
			'address1'     => WC()->countries->get_base_address(),
			'address2'     => WC()->countries->get_base_address_2(),
			'city'         => WC()->countries->get_base_city(),
			'postcode'     => WC()->countries->get_base_postcode(),
			'currency'     => get_woocommerce_currency(),
		];

		return rest_ensure_response( $location );
	}

	/**
	 * Save location info.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Boolean success.
	 */
	public function api_save_location( $request ) {
		$params   = $request->get_params();
		$defaults = [
			'countrystate' => '',
			'address1'     => '',
			'address2'     => '',
			'city'         => '',
			'postcode'     => '',
			'currency'     => '',
		];
		$args     = wp_parse_args( $params, $defaults );

		update_option( 'woocommerce_store_address', $args['address1'] );
		update_option( 'woocommerce_store_address_2', $args['address2'] );
		update_option( 'woocommerce_store_city', $args['city'] );
		update_option( 'woocommerce_default_country', $args['countrystate'] );
		update_option( 'woocommerce_store_postcode', $args['postcode'] );
		update_option( 'woocommerce_currency', $args['currency'] );

		// @todo when is the best time to do this?
		$this->set_smart_defaults();

		return rest_ensure_response( true );
	}

	/**
	 * Get Stripe settings.
	 *
	 * @return WP_REST_Response containing info.
	 */
	public function api_get_stripe_settings() {
		$defaults = [
			'enabled'            => false,
			'testMode'           => false,
			'publishableKey'     => '',
			'secretKey'          => '',
			'testPublishableKey' => '',
			'testSecretKey'      => '',
		];
		$gateways = WC_Payment_Gateways::instance()->payment_gateways();

		if ( ! isset( $gateways['stripe'] ) ) {
			return rest_ensure_response( $defaults );
		}

		$stripe   = $gateways['stripe'];
		$settings = [
			'enabled'            => 'yes' === $stripe->get_option( 'enabled', false ) ? true : false,
			'testMode'           => 'yes' === $stripe->get_option( 'testmode', false ) ? true : false,
			'publishableKey'     => $stripe->get_option( 'publishable_key', '' ),
			'secretKey'          => $stripe->get_option( 'secret_key', '' ),
			'testPublishableKey' => $stripe->get_option( 'test_publishable_key', '' ),
			'testSecretKey'      => $stripe->get_option( 'test_secret_key', '' ),
		];

		return rest_ensure_response( $settings );
	}

	/**
	 * Save Stripe settings.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Boolean success.
	 */
	public function api_save_stripe_settings( $request ) {
		$params   = $request->get_params();
		$defaults = [
			'enabled'            => false,
			'testMode'           => false,
			'publishableKey'     => '',
			'secretKey'          => '',
			'testPublishableKey' => '',
			'testSecretKey'      => '',
		];
		$args     = wp_parse_args( $params, $defaults );

		$gateways = WC_Payment_Gateways::instance()->payment_gateways();
		if ( ! isset( $gateways['stripe'] ) ) {
			if ( $args['enabled'] ) {
				// Stripe is not installed and we want to use it. Install/Activate/Initialize it.
				Plugin_Manager::activate( 'woocommerce-gateway-stripe' );
				do_action( 'plugins_loaded' );
				WC_Payment_Gateways::instance()->init();
				$gateways = WC_Payment_Gateways::instance()->payment_gateways();
			} else {
				// Stripe is not installed and we don't want to use it. No settings needed.
				return rest_ensure_response( true );
			}
		}

		$stripe = $gateways['stripe'];
		$stripe->update_option( 'enabled', $args['enabled'] ? 'yes' : 'no' );
		$stripe->update_option( 'testmode', $args['testMode'] ? 'yes' : 'no' );
		$stripe->update_option( 'publishable_key', $args['publishableKey'] );
		$stripe->update_option( 'secret_key', $args['secretKey'] );
		$stripe->update_option( 'test_publishable_key', $args['testPublishableKey'] );
		$stripe->update_option( 'test_secret_key', $args['testSecretKey'] );
		return rest_ensure_response( true );
	}

	/**
	 * Set general settings that our users will want (e.g. no reason for product reviews on a news membership).
	 */
	protected function set_smart_defaults() {
		// Create Shop, My Account, etc. pages if not already created.
		WC_Install::create_pages();

		// Disable coupons and reviews.
		update_option( 'woocommerce_enable_coupons', 'no' );
		update_option( 'woocommerce_enable_reviews', 'no' );
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
			'newspack-subscriptions-onboarding-wizard',
			Newspack::plugin_url() . '/assets/dist/subscriptionsOnboarding.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/subscriptionsOnboarding.js' ),
			true
		);

		wp_register_style(
			'newspack-subscriptions-onboarding-wizard',
			Newspack::plugin_url() . '/assets/dist/subscriptionsOnboarding.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/subscriptionsOnboarding.css' )
		);
		wp_style_add_data( 'newspack-subscriptions-onboarding-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-subscriptions-onboarding-wizard' );
	}
}
new Subscriptions_Onboarding_Wizard();
