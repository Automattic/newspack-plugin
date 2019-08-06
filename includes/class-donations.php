<?php
/**
 * Newspack Donations features management.
 *
 * @package Newspack
 */

namespace Newspack;

use  \WP_Error, \WC_Product_Simple, \WC_Product_Subscription, \WC_Name_Your_Price_Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Handles donations functionality.
 */
class Donations {
	const DONATION_PRODUCT_ID_OPTION              = 'newspack_donation_product_id';
	const DONATION_SUGGESTED_AMOUNT_META          = 'newspack_donation_suggested_amount';
	const DONATION_UNTIERED_SUGGESTED_AMOUNT_META = 'newspack_donation_untiered_suggested_amount';
	const DONATION_TIERED_META                    = 'newspack_donation_is_tiered';

	/**
	 * Initialize hooks/filters/etc.
	 */
	public static function init() {
		if ( ! is_admin() ) {
			add_action( 'wp_loaded', [ __CLASS__, 'process_donation_form' ], 99 );
		}
	}

	/**
	 * Check whether WooCommerce and associated extensions required for donations are active.
	 *
	 * @return bool|WP_Error True if active. WP_Error if not.
	 */
	public static function is_woocommerce_suite_active() {
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
	protected static function get_donation_default_settings( $suggest_donations = false ) {
		return [
			'name'                    => '',
			'suggestedAmounts'        => $suggest_donations ? [ 7.50, 15.00, 30.00 ] : [],
			'suggestedAmountUntiered' => $suggest_donations ? 15.00 : 0,
			'currencySymbol'          => html_entity_decode( \get_woocommerce_currency_symbol() ),
			'tiered'                  => false,
			'image'                   => false,
			'created'                 => false,
			'products'                => [
				'once'  => false,
				'month' => false,
				'year'  => false,
			],
		];
	}

	/**
	 * Get the donation settings.
	 *
	 * @return Array of donation settings or WP_Error if WooCommerce is not set up.
	 */
	public static function get_donation_settings() {
		$ready = self::is_woocommerce_suite_active();
		if ( is_wp_error( $ready ) ) {
			return $ready;
		}

		$settings = self::get_donation_default_settings( true );

		$product_id = get_option( self::DONATION_PRODUCT_ID_OPTION, 0 );
		if ( ! $product_id ) {
			return $settings;
		}

		$product = \wc_get_product( $product_id );
		if ( ! $product || 'grouped' !== $product->get_type() ) {
			return $settings;
		}

		$settings['created'] = true;
		$settings['name']    = $product->get_name();
		$settings['image']   = [
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

		// Add the product IDs for each frequency.
		foreach ( $product->get_children() as $child_id ) {
			$child_product = wc_get_product( $child_id );
			if ( ! $child_product || ! (bool) WC_Name_Your_Price_Helpers::is_nyp( $child_id ) ) {
				continue;
			}

			if ( 'subscription' === $child_product->get_type() ) {
				if ( 'year' === $child_product->get_meta( '_subscription_period', true ) ) {
					$settings['products']['year'] = $child_id;
				} elseif ( 'month' == $child_product->get_meta( '_subscription_period', true ) ) {
					$settings['products']['month'] = $child_id;
				}
			} elseif ( 'simple' === $child_product->get_type() ) {
				$settings['products']['once'] = $child_id;
			}
		}

		return $settings;
	}

	/**
	 * Set the donation settings.
	 *
	 * @param array $args Array of settings info.
	 * @return array Updated settings.
	 */
	public static function set_donation_settings( $args ) {
		$ready = self::is_woocommerce_suite_active();
		if ( is_wp_error( $ready ) ) {
			return $ready;
		}

		$defaults = self::get_donation_default_settings();
		$args     = wp_parse_args( $args, $defaults );

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
	 * @param array $args Info that will be used to create the products.
	 */
	protected static function create_donation_product( $args ) {
		$defaults = self::get_donation_default_settings();
		$args     = wp_parse_args( $args, $defaults );

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
		$parent_product->set_catalog_visibility( 'hidden' );
		$parent_product->set_virtual( true );
		$parent_product->set_sold_individually( true );

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
		$monthly_product->set_virtual( true );
		$monthly_product->set_catalog_visibility( 'hidden' );
		$monthly_product->set_sold_individually( true );
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
		$yearly_product->set_virtual( true );
		$yearly_product->set_catalog_visibility( 'hidden' );
		$yearly_product->set_sold_individually( true );
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
		$once_product->set_virtual( true );
		$once_product->set_catalog_visibility( 'hidden' );
		$once_product->set_sold_individually( true );
		$once_product->save();

		$parent_product->set_children(
			[
				$monthly_product->get_id(),
				$yearly_product->get_id(),
				$once_product->get_id(),
			] 
		);
		$parent_product->save();
		update_option( self::DONATION_PRODUCT_ID_OPTION, $parent_product->get_id() );
	}

	/**
	 * Update the donations products.
	 *
	 * @param string $args Donations settings.
	 */
	protected static function update_donation_product( $args ) {
		$defaults   = self::get_donation_default_settings();
		$args       = wp_parse_args( $args, $defaults );
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
	 * Remove all donation products from the cart.
	 */
	protected static function remove_donations_from_cart() {
		$donation_settings = self::get_donation_settings();
		if ( ! $donation_settings['created'] ) {
			return;
		}

		foreach ( \WC()->cart->get_cart() as $cart_key => $cart_item ) {
			if ( ! empty( $cart_item['product_id'] ) && in_array( $cart_item['product_id'], $donation_settings['products'] ) ) {
				\WC()->cart->remove_cart_item( $cart_key );
			}
		}
	}

	/**
	 * Handle submission of the donation form.
	 */
	public static function process_donation_form() {
		$donation_form_submitted = filter_input( INPUT_GET, 'newspack_donate', FILTER_SANITIZE_NUMBER_INT );
		if ( ! $donation_form_submitted || is_wp_error( self::is_woocommerce_suite_active() ) ) {
			return;
		}

		$donation_settings = self::get_donation_settings();
		if ( ! $donation_settings['created'] ) {
			return;
		}

		// Parse values from the form.
		$donation_frequency = filter_input( INPUT_GET, 'donation_frequency', FILTER_SANITIZE_STRING );
		if ( ! $donation_frequency ) {
			return;
		}
		$donation_value = filter_input( INPUT_GET, 'donation_value_' . $donation_frequency, FILTER_SANITIZE_STRING );
		if ( ! $donation_value ) {
			$donation_value = filter_input( INPUT_GET, 'donation_value_' . $donation_frequency . '_untiered', FILTER_SANITIZE_STRING );

			if ( ! $donation_value ) {
				return;
			}
		}
		if ( 'other' === $donation_value ) {
			$donation_value = filter_input( INPUT_GET, 'donation_value_' . $donation_frequency . '_other', FILTER_SANITIZE_STRING );
			if ( ! $donation_value ) {
				return;
			}
		}

		// Add product to cart.
		$product_id = $donation_settings['products'][ $donation_frequency ];
		if ( ! $product_id ) {
			return;
		}

		self::remove_donations_from_cart();

		\WC()->cart->add_to_cart( 
			$product_id, 
			1, 
			0, 
			[], 
			[ 
				'nyp' => (float) \WC_Name_Your_Price_Helpers::standardize_number( $donation_value ),
			]
		);

		// Redirect to checkout.
		\wp_safe_redirect( \wc_get_page_permalink( 'checkout' ) );
		exit;
	}
}
Donations::init();
