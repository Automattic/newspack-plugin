<?php
/**
 * WooCommerce plugin(s) configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

use  \WC_Product_Simple, \WC_Product_Subscription;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Provide an interface for configuring and querying the configuration of WooCommerce.
 */
class WooCommerce_Configuration_Manager extends Configuration_Manager {

	const DONATION_PRODUCT_ID_OPTION = 'newspack_donation_product_id';
	const DONATION_SUGGESTED_AMOUNT_META = 'newspack_donation_suggested_amount';

	/**
	 * Get the donation settings.
	 *
	 * @return Array of dontion settings (See $settings at the top of the method for format).
	 */
	public function get_donation_settings() {
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
	 * Set the donation settings.
	 *
	 * @param array $args Array of settings info. See $defaults at top of this method for format.
	 * @return array Updated settings.
	 */
	public function set_donation_settings( $args ) {
		$defaults = [
			'name' => '',
			'suggestedAmount' => 0,
			'imageID' => 0,
		];
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
	 * @param array $args Info that will be used to create the products. See $defaults at top of this method for format.
	 */
	protected function create_donation_product( $args ) {
		$defaults = [
			'name' => '',
			'suggestedAmount' => 0,
			'imageID' => 0,
		];
		$args = wp_parse_args( $args, $defaults );

		// Parent product.
		$parent_product = new \WC_Product_Grouped();
		$parent_product->set_name( $args['name'] );
		if ( $args['imageID'] ) {
			$parent_product->set_image_id( $args['imageID'] );
		}
		$parent_product->update_meta_data( self::DONATION_SUGGESTED_AMOUNT_META, floatval( $args['suggestedAmount'] ) );

		// Monthly donation.
		$monthly_product = new \WC_Product_Subscription();
		/* translators: %s: Product name */
		$monthly_product->set_name( sprintf( __( '%s: Monthly', 'newspack' ), $args['name'] ) );
		if ( $args['imageID'] ) {
			$monthly_product->set_image_id( $args['imageID'] );
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
		if ( $args['imageID'] ) {
			$yearly_product->set_image_id( $args['imageID'] );
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
		if ( $args['imageID'] ) {
			$once_product->set_image_id( $args['imageID'] );
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
	protected function update_donation_product( $args ) {
		$defaults = [
			'name' => '',
			'suggestedAmount' => 0,
			'imageID' => 0,
		];
		$args = wp_parse_args( $args, $defaults );
		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );
		$parent_product = \wc_get_product( $product_id );

		$parent_product->set_name( $args['name'] );
		$parent_product->set_image_id( $args['imageID'] );
		$parent_product->update_meta_data( self::DONATION_SUGGESTED_AMOUNT_META, floatval( $args['suggestedAmount'] ) );
		$parent_product->set_status( 'publish' );
		$parent_product->save();

		foreach ( $parent_product->get_children() as $child_id ) {
			$child_product = \wc_get_product( $child_id );
			if ( ! $child_product ) {
				continue;
			}

			$child_product->set_status( 'publish' );
			$child_product->set_image_id( $args['imageID'] );
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
}
