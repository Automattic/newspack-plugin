<?php
/**
 * WooCommerce plugin(s) configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

use  \WP_Error, \WC_Product_Simple, \WC_Product_Subscription;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Provide an interface for configuring and querying the configuration of WooCommerce.
 */
class WooCommerce_Configuration_Manager extends Configuration_Manager {

	const DONATION_PRODUCT_ID_OPTION = 'newspack_donation_product_id';
	const DONATION_SUGGESTED_AMOUNT_META = 'newspack_donation_suggested_amount';
	const DONATION_UNTIERED_SUGGESTED_AMOUNT_META = 'newspack_donation_untiered_suggested_amount';
	const DONATION_TIERED_META = 'newspack_donation_is_tiered';

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'woocommerce';

	/**
	 * Check whether WooCommerce and associated extensions are active.
	 *
	 * @return bool|WP_Error True if active. WP_Error if not.
	 */
	public function is_woocommerce_suite_active() {
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
	 * Get the default donation settings.
	 *
	 * @param bool $suggest_donations Whether to include suggested default donation amounts (Default: false).
	 * @return array Array of settings info.
	 */
	protected function get_donation_default_settings( $suggest_donations = false ) {
		return [
			'name' => '',
			'suggestedAmounts' => $suggest_donations ? [ 7.50, 15.00, 30.00 ] : [],
			'suggestedAmountUntiered' => $suggest_donations ? 15.00 : 0,
			'currencySymbol' => html_entity_decode( \get_woocommerce_currency_symbol() ),
			'tiered' => false,
			'image' => false,
			'created' => false,
		];
	}

	/**
	 * Get the donation settings.
	 *
	 * @return Array of donation settings or WP_Error if WooCommerce is not set up.
	 */
	public function get_donation_settings() {
		$ready = $this->is_woocommerce_suite_active();
		if ( is_wp_error( $ready ) ) {
			return $ready;
		}

		$settings = $this->get_donation_default_settings( true );

		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );
		if ( ! $product_id ) {
			return $settings;
		}

		$product = \wc_get_product( $product_id );
		if ( ! $product || 'grouped' !== $product->get_type() ) {
			return $settings;
		}

		$settings['created'] = true;
		$settings['name'] = $product->get_name();
		$settings['image'] = [
			'id'  => $product->get_image_id(),
			'url' => $product->get_image_id() ? current( wp_get_attachment_image_src( $product->get_image_id(), 'woocommerce_thumbnail' ) ) : wc_placeholder_img_src( 'woocommerce_thumbnail' ),
		];

		$suggested_amounts = $product->get_meta( self::DONATION_SUGGESTED_AMOUNT_META, true );
		if ( is_array( $suggested_amounts ) ) {
			$suggested_amounts = array_map( 'wc_format_decimal', $suggested_amounts );
			sort( $suggested_amounts, SORT_NUMERIC );
			$settings['suggestedAmounts'] = $suggested_amounts;
		}

		$untiered_suggested_amount = $product->get_meta( self::DONATION_UNTIERED_SUGGESTED_AMOUNT_META, true );
		if ( is_numeric( $untiered_suggested_amount ) ) {
			$settings['suggestedAmountUntiered'] = wc_format_decimal( $untiered_suggested_amount );
		}

		$settings['tiered'] = (bool) $product->get_meta( self::DONATION_TIERED_META, true );

		return $settings;
	}

	/**
	 * Set the donation settings.
	 *
	 * @param array $args Array of settings info.
	 * @return array Updated settings.
	 */
	public function set_donation_settings( $args ) {
		$ready = $this->is_woocommerce_suite_active();
		if ( is_wp_error( $ready ) ) {
			return $ready;
		}

		$defaults = $this->get_donation_default_settings();
		$args = wp_parse_args( $args, $defaults );

		// Create the product if it hasn't been created yet.
		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );
		if ( ! $product_id ) {
			$this->create_donation_product( $args );
			return $this->get_donation_settings();
		}

		// Re-create the product if the data is corrupted.
		$product = \wc_get_product( $product_id );
		if ( ! $product || 'grouped' !== $product->get_type() ) {
			$this->create_donation_product( $args );
			return $this->get_donation_settings();
		}

		// Update the existing product.
		$this->update_donation_product( $args );
		return $this->get_donation_settings();
	}

	/**
	 * Create new donations products.
	 *
	 * @param array $args Info that will be used to create the products.
	 */
	protected function create_donation_product( $args ) {
		$defaults = $this->get_donation_default_settings();
		$args = wp_parse_args( $args, $defaults );

		// Parent product.
		$parent_product = new \WC_Product_Grouped();
		$parent_product->set_name( $args['name'] );
		if ( $args['imageID'] ) {
			$parent_product->set_image_id( $args['imageID'] );
		}
		$suggested_amounts = array_map( 'wc_format_decimal', $args['suggestedAmounts'] );
		sort( $suggested_amounts, SORT_NUMERIC );
		$parent_product->update_meta_data( self::DONATION_SUGGESTED_AMOUNT_META, $suggested_amounts );
		$parent_product->update_meta_data( self::DONATION_UNTIERED_SUGGESTED_AMOUNT_META, wc_format_decimal( $args['suggestedAmountUntiered'] ) );
		$parent_product->update_meta_data( self::DONATION_TIERED_META, (bool) $args['tiered'] );

		$default_price = $args['tiered'] ? wc_format_decimal( $args['suggestedAmounts'][ floor( count( $args['suggestedAmounts'] ) / 2 ) ] ) : wc_format_decimal( $args['suggestedAmountUntiered'] );

		// Monthly donation.
		$monthly_product = new \WC_Product_Subscription();
		/* translators: %s: Product name */
		$monthly_product->set_name( sprintf( __( '%s: Monthly', 'newspack' ), $args['name'] ) );
		if ( $args['imageID'] ) {
			$monthly_product->set_image_id( $args['imageID'] );
		}
		$monthly_product->set_regular_price( $default_price );
		$monthly_product->update_meta_data( '_suggested_price', $default_price );
		$monthly_product->update_meta_data( '_hide_nyp_minimum', 'yes' );
		$monthly_product->update_meta_data( '_min_price', wc_format_decimal( 1.0 ) );
		$monthly_product->update_meta_data( '_nyp', 'yes' );
		$monthly_product->update_meta_data( '_subscription_price', wc_format_decimal( $default_price ) );
		$monthly_product->update_meta_data( '_subscription_period', 'month' );
		$monthly_product->update_meta_data( '_subscription_period_interval', 1 );
		$monthly_product->save();

		// Yearly donation.
		$yearly_product = new \WC_Product_Subscription();
		/* translators: %s: Product name */
		$yearly_product->set_name( sprintf( __( '%s: Yearly', 'newspack' ), $args['name'] ) );
		if ( $args['imageID'] ) {
			$yearly_product->set_image_id( $args['imageID'] );
		}
		$yearly_product->set_regular_price( 12 * $default_price );
		$yearly_product->update_meta_data( '_suggested_price', 12 * $default_price );
		$yearly_product->update_meta_data( '_hide_nyp_minimum', 'yes' );
		$yearly_product->update_meta_data( '_min_price', wc_format_decimal( 1.0 ) );
		$yearly_product->update_meta_data( '_nyp', 'yes' );
		$yearly_product->update_meta_data( '_subscription_price', wc_format_decimal( 12 * $default_price ) );
		$yearly_product->update_meta_data( '_subscription_period', 'year' );
		$yearly_product->update_meta_data( '_subscription_period_interval', 1 );
		$yearly_product->save();

		// One-time donation.
		$once_product = new \WC_Product_Simple();
		/* translators: %s: Product name */
		$once_product->set_name( sprintf( __( '%s: One-Time', 'newspack' ), $args['name'] ) );
		if ( $args['imageID'] ) {
			$once_product->set_image_id( $args['imageID'] );
		}
		$once_product->set_regular_price( $default_price );
		$once_product->update_meta_data( '_suggested_price', $default_price );
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
	 * @param string $args Donations settings.
	 */
	protected function update_donation_product( $args ) {
		$defaults = $this->get_donation_default_settings();
		$args = wp_parse_args( $args, $defaults );
		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );

		$parent_product = \wc_get_product( $product_id );
		$parent_product->set_name( $args['name'] );
		$parent_product->set_image_id( $args['imageID'] );
		$suggested_amounts = array_map( 'wc_format_decimal', $args['suggestedAmounts'] );
		sort( $suggested_amounts, SORT_NUMERIC );
		$parent_product->update_meta_data( self::DONATION_SUGGESTED_AMOUNT_META, $suggested_amounts );
		$parent_product->update_meta_data( self::DONATION_UNTIERED_SUGGESTED_AMOUNT_META, wc_format_decimal( $args['suggestedAmountUntiered'] ) );
		$parent_product->update_meta_data( self::DONATION_TIERED_META, (bool) $args['tiered'] );
		$parent_product->set_status( 'publish' );
		$parent_product->save();

		$default_price = $args['tiered'] ? wc_format_decimal( $args['suggestedAmounts'][ floor( count( $args['suggestedAmounts'] ) / 2 ) ] ) : wc_format_decimal( $args['suggestedAmountUntiered'] );

		foreach ( $parent_product->get_children() as $child_id ) {
			$child_product = \wc_get_product( $child_id );
			if ( ! $child_product ) {
				continue;
			}

			$child_product->set_status( 'publish' );
			$child_product->set_image_id( $args['imageID'] );
			$child_product->set_regular_price( $default_price );
			$child_product->update_meta_data( '_suggested_price', $default_price );
			if ( 'subscription' === $child_product->get_type() ) {
				if ( 'year' === $child_product->get_meta( '_subscription_period', true ) ) {
					/* translators: %s: Product name */
					$child_product->set_name( sprintf( __( '%s: Yearly', 'newspack' ), $args['name'] ) );
					$yearly_price = 12 * $default_price;
					$child_product->update_meta_data( '_subscription_price', \wc_format_decimal( $yearly_price ) );
					$child_product->update_meta_data( '_suggested_price', \wc_format_decimal( $yearly_price ) );
					$child_product->set_regular_price( $yearly_price );
				} else {
					/* translators: %s: Product name */
					$child_product->set_name( sprintf( __( '%s: Monthly', 'newspack' ), $args['name'] ) );
					$child_product->update_meta_data( '_subscription_price', wc_format_decimal( $default_price ) );
				}
			} else {
				/* translators: %s: Product name */
				$child_product->set_name( sprintf( __( '%s: One-Time', 'newspack' ), $args['name'] ) );
			}
			$child_product->save();
		}
	}

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
}
