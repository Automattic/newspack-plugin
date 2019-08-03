<?php
/**
 * WooCommerce plugin(s) configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

use \WC_Payment_Gateways;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Provide an interface for configuring and querying the configuration of WooCommerce.
 */
class WooCommerce_Configuration_Manager extends Configuration_Manager {

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'woocommerce';

	/**
	 * Get whether the WooCommerce plugin is active and set up.
	 *
	 * @todo Actually implement this.
	 * @return bool Whether WooCommerce is active and set up.
	 */
	public function is_configured() {
		return true;
	}

	/**
	 * Configure WooCommerce for Newspack use.
	 *
	 * @todo Actually implement this and set up Shop page, default settings, etc.
	 * @return bool || WP_Error Return true if successful, or WP_Error if not.
	 */
	public function configure() {
		return true;
	}

	/**
	 * Retrieve WooCommerce country/state fields to populate Select
	 *
	 * @return Array Array of objects formatted for use in a SelectControl.
	 */
	public function country_state_fields() {
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
		return $location_info;
	}

	/**
	 * Retrieve WooCommerce currency fields to populate Select
	 *
	 * @return Array Array of objects formatted for use in a SelectControl.
	 */
	public function currency_fields() {
		$currencies    = get_woocommerce_currencies();
		$currency_info = [];
		foreach ( $currencies as $code => $currency ) {
			$currency_info[] = [
				'value' => $code,
				'label' => html_entity_decode( $currency ),
			];
		}
		return $currency_info;
	}

	/**
	 * Retrieve payment data
	 *
	 * @return Array Array of data.
	 */
	public function payment_data() {
		$gateways = WC_Payment_Gateways::instance()->payment_gateways();
		if ( ! isset( $gateways['stripe'] ) ) {
			return [
				'enabled'            => false,
				'testMode'           => false,
				'publishableKey'     => '',
				'secretKey'          => '',
				'testPublishableKey' => '',
				'testSecretKey'      => '',
			];
		}
		$stripe = $gateways['stripe'];
		return [
			'enabled'            => 'yes' === $stripe->get_option( 'enabled', false ) ? true : false,
			'testMode'           => 'yes' === $stripe->get_option( 'testmode', false ) ? true : false,
			'publishableKey'     => $stripe->get_option( 'publishable_key', '' ),
			'secretKey'          => $stripe->get_option( 'secret_key', '' ),
			'testPublishableKey' => $stripe->get_option( 'test_publishable_key', '' ),
			'testSecretKey'      => $stripe->get_option( 'test_secret_key', '' ),
		];
	}

	/**
	 * Retrieve location data
	 *
	 * @return Array Array of data.
	 */
	public function location_data() {
		$countrystate_raw = wc_get_base_location();
		return [
			'countrystate' => '*' === $countrystate_raw['state'] ? $countrystate_raw['country'] : $countrystate_raw['country'] . ':' . $countrystate_raw['state'],
			'address1'     => WC()->countries->get_base_address(),
			'address2'     => WC()->countries->get_base_address_2(),
			'city'         => WC()->countries->get_base_city(),
			'postcode'     => WC()->countries->get_base_postcode(),
			'currency'     => get_woocommerce_currency(),
		];
	}
}
