<?php
/**
 * Newspack address/payments/api keys/etc. setup.
 *
 * @package Newspack
 */

namespace Newspack;

use \WC_Install;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up general store info.
 */
class Onboarding_Wizard extends Wizard {

	/**
	 * The name of this wizard.
	 *
	 * @var string
	 */
	protected $name = 'Onboarding';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-onboarding-wizard';

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

	public function register_api_endpoints() {
		// Get location info.
		register_rest_route(
			'newspack/v1/wizard/',
			'/location/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_location' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Save location info.
		register_rest_route(
			'newspack/v1/wizard/',
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
	}

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

	public function api_save_location( $request ) {
		$params   = $request->get_params();
		$defaults = [
			'countrystate' => '',
			'address1' => '',
			'address2' => '',
			'city' => '',
			'postcode' => '',
			'currency' => '',
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

		wp_register_script(
			'newspack-onboarding-wizard',
			Newspack::plugin_url() . '/assets/dist/onboarding.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/onboarding.js' ),
			true
		);

		$countries     = WC()->countries->get_countries();
		$states        = WC()->countries->get_states();
		$location_info = [];
		foreach( $countries as $country_code => $country ) {
			if ( isset ( $states[ $country_code ] ) ) {
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
		wp_localize_script( 'newspack-onboarding-wizard', 'newspack_location_info', $location_info );
		
		$currencies    = get_woocommerce_currencies();
		$currency_info = [];
		foreach ( $currencies as $code => $currency ) {
			$currency_info[] = [
				'value' => $code,
				'label' => html_entity_decode( $currency ),
			];
		}
		wp_localize_script( 'newspack-onboarding-wizard', 'newspack_currency_info', $currency_info );

		wp_enqueue_script( 'newspack-onboarding-wizard' );

		wp_register_style(
			'newspack-onboarding-wizard',
			Newspack::plugin_url() . '/assets/dist/onboarding.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/onboarding.css' )
		);
		wp_style_add_data( 'newspack-onboarding-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-onboarding-wizard' );
	}
}
new Onboarding_Wizard();
