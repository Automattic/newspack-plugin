<?php
/**
 * Add ability to cover transaction fees for an order.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Order UTM class.
 */
class WooCommerce_Cover_Fees {
	const CUSTOM_FIELD_NAME = 'newspack-wc-pay-fees';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_filter( 'woocommerce_checkout_fields', [ __CLASS__, 'add_checkout_fields' ] );
		\add_filter( 'woocommerce_checkout_create_order', [ __CLASS__, 'set_total_with_fees' ], 1, 2 );
		\add_filter( 'wc_stripe_description', [ __CLASS__, 'add_input_to_stripe_gateway_description' ] );
	}

	/**
	 * Add the "cover fees" checkout field.
	 *
	 * @param array $fields Checkout fields.
	 *
	 * @return array
	 */
	public static function add_checkout_fields( $fields ) {
		if ( ! self::is_modal_checkout() ) {
			return $fields;
		}
		$fields['newspack'] = [
			self::CUSTOM_FIELD_NAME => [
				'type' => 'checkbox',
			],
		];
		return $fields;
	}

	/**
	 * Set order total, taking the fee into account.
	 *
	 * @param \WC_Order $order Order object.
	 * @param array     $data  Posted data.
	 *
	 * @return \WC_Order
	 */
	public static function set_total_with_fees( $order, $data ) {
		if ( isset( $data[ self::CUSTOM_FIELD_NAME ] ) && 1 === $data[ self::CUSTOM_FIELD_NAME ] ) {
			$order->add_order_note( __( 'The donor opted to cover Stripe\'s transaction fee. The total amount will be updated.', 'newspack-plugin' ) );
			$order->set_total( self::get_total_with_fee( $order->get_total() ) );
		}
		return $order;
	}

	/**
	 * Is this the modal checkout?
	 *
	 * This code is taken from Newspack Blocks, but can't be reused directly because
	 * WC renders the checkout form before Blocks' code is available.
	 */
	private static function is_modal_checkout() {
		if ( isset( $_REQUEST['modal_checkout'] ) && 1 === intval( $_REQUEST['modal_checkout'] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return true;
		}
		if ( isset( $_POST['post_data'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			parse_str( \sanitize_text_field( \wp_unslash( $_POST['post_data'] ) ), $post_data ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( isset( $post_data['modal_checkout'] ) && 1 === intval( $post_data['modal_checkout'] ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Add "cover fees" input to Stripe checkout description.
	 *
	 * @param string $desc Description.
	 *
	 * @return string
	 */
	public static function add_input_to_stripe_gateway_description( $desc ) {
		if ( ! self::is_modal_checkout() ) {
			return $desc;
		}
		ob_start();
		?>
			<p class="form-row">
				<input id=<?php echo esc_attr( self::CUSTOM_FIELD_NAME ); ?> name=<?php echo esc_attr( self::CUSTOM_FIELD_NAME ); ?> type="checkbox" value="true" style="width:auto;">
				<label for=<?php echo esc_attr( self::CUSTOM_FIELD_NAME ); ?> style="display:inline;">
					<b><?php echo esc_html( __( 'Cover transaction fees?', 'newspack-plugin' ) ); ?></b><br/>
					<?php
						echo esc_html(
							sprintf(
								// Translators: %s is the transaction fee, as percentage with static portion (e.g. 2% + $0.3).
								__( 'Cover Stripe’s %s transaction fee, so that The News Paper receives 100%% of your payment.', 'newspack-plugin' ),
								self::get_fee_human_readable_value()
							)
						);
					?>

				</label>
			</p>
		<?php
		$desc .= ob_get_clean();
		return $desc;
	}

	/**
	 * Get the fee multiplier value.
	 */
	private static function get_stripe_fee_multiplier_value() {
		return floatval( get_option( 'newspack_blocks_donate_fee_multiplier', '2.9' ) );
	}

	/**
	 * Get the fee static portion value.
	 */
	private static function get_stripe_fee_static_value() {
		return floatval( get_option( 'newspack_blocks_donate_fee_static', '0.3' ) );
	}

	/**
	 * Get the fee human-redable value.
	 */
	private static function get_fee_human_readable_value() {
		$fee_static = sprintf( get_woocommerce_price_format(), get_woocommerce_currency_symbol(), self::get_stripe_fee_static_value() );
		return self::get_stripe_fee_multiplier_value() . '% + ' . $fee_static;
	}

	/**
	 * Calculate the adjusted total, taking the fee into account.
	 *
	 * @param float $total Total amount.
	 *
	 * @return float
	 */
	private static function get_total_with_fee( $total ) {
		$fee_multiplier = self::get_stripe_fee_multiplier_value();
		$fee_static     = self::get_stripe_fee_static_value();
		$fee            = ( ( ( $total + $fee_static ) / ( 100 - $fee_multiplier ) ) * 100 - $total );
		return $total + $fee;
	}
}
WooCommerce_Cover_Fees::init();
