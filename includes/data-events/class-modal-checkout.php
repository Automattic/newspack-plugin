<?php
/**
 * Newspack Data Events Modal Checkout helper.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events;

use Newspack\Data_Events;
use WP_Error;

/**
 * Class to register the Modal_Checkout listeners.
 */
final class Modal_Checkout {

	/**
	 * The name of the action for form submissions
	 */
	const FORM_SUBMISSION = 'form_submission_received';

	/**
	 * Initialize the class by registering the listeners.
	 *
	 * @return void
	 */
	public static function init() {
		Data_Events::register_listener(
			'newspack_blocks_checkout_button_modal',
			'modal_checkout_interaction',
			[ __CLASS__, 'checkout_button_purchase' ]
		);

		Data_Events::register_listener(
			'newspack_blocks_donate_block_modal',
			'modal_checkout_interaction',
			[ __CLASS__, 'donate_button_purchase' ]
		);

		Data_Events::register_listener(
			'woocommerce_checkout_order_created',
			'modal_checkout_interaction',
			[ __CLASS__, 'checkout_attempt' ]
		);

		Data_Events::register_listener(
			'newspack_blocks_modal_continue',
			'modal_checkout_interaction',
			[ __CLASS__, 'modal_pagination' ]
		);
	}

	/**
	 * Returns whether a product is a one time purchase, or recurring and when.
	 *
	 * @param string $product_id Product's ID.
	 */
	public static function get_purchase_recurrence( $product_id ) {
		$recurrence = get_post_meta( $product_id, '_subscription_period', true );
		if ( empty( $recurrence ) ) {
			$recurrence = 'once';
		}
		return $recurrence;
	}

	/**
	 * Fires when a reader opens the modal checkout from a checkout button block.
	 *
	 * @param string $price Purchase price.
	 * @param string $currency Purchase price currency.
	 * @param string $product_id Purchased product ID.
	 * @param string $referer Purchased product referer.
	 *
	 * @return ?array
	 */
	public static function checkout_button_purchase( $price, $currency, $product_id, $referer ) {
		$data = [
			'action'      => self::FORM_SUBMISSION, // Not sure if this is correct?
			'action_type' => 'paid_membership', // TODO: is this okay? The Checkout Button Block can technically be used for ANY Woo product.
			'referer'     => $referer,
			'amount'      => $price,
			'currency'    => $currency,
			'product_id'  => $product_id,
			'recurrence'  => self::get_purchase_recurrence( $product_id ),
		];

		return $data;
	}

	/**
	 * Fires when a reader opens the modal checkout from a donate block.
	 *
	 * @param string $price Donation price.
	 * @param string $currency Donation price currency.
	 * @param string $product_id Donation product ID.
	 * @param string $referer Donation referrer.
	 *
	 * @return ?array
	 */
	public static function donate_button_purchase( $price, $currency, $product_id, $referer ) {
		$data = [
			'action'      => self::FORM_SUBMISSION, // Not sure if this is correct?
			'action_type' => 'donation',
			'referer'     => $referer,
			'amount'      => $price,
			'currency'    => $currency,
			'product_id'  => $product_id,
			'recurrence'  => self::get_purchase_recurrence( $product_id ),
		];

		return $data;
	}

	/**
	 * Fires when a reader attempts to complete an order with the modal checkout.
	 *
	 * @param array $order WooCommerce order information.
	 *
	 * @return ?array
	 */
	public static function checkout_attempt( $order ) {

		$data = [
			'action'   => self::FORM_SUBMISSION,
			'order_id' => $order->get_id(),
			'amount'   => $order->get_total(),
			'currency' => $order->get_currency(),
		];
		return $data;
	}

	/**
	 * Capture modal pagination (when the Continue button is clicked).
	 *
	 * @param array $metadata Information passed by action.
	 *
	 * @return ?array
	 */
	public static function modal_pagination( $metadata ) {
		check_ajax_referer( 'newspack_checkout_continue' );

		$data = [
			'action'           => self::FORM_SUBMISSION,
			'modal_pagination' => $metadata['current_modal_page'],
		];

		return $data;
	}
}
Modal_Checkout::init();
