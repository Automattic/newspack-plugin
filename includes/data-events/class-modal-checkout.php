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
	 * The name of the action for form submissions.
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

		/*
		Data_Events::register_listener(
			'wp_loaded',
			'modal_checkout_interaction',
			[ __CLASS__, 'modal_pagination' ]
		);
		*/
	}

	/**
	 * Returns whether a product is a one time purchase, or recurring and when.
	 *
	 * @param string $product_id Product's ID.
	 */
	public static function get_purchase_recurrrence( $product_id ) {
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
			'action'      => self::FORM_SUBMISSION, // not sure if needed/correct here? Fires when modal opens, not when form is submitted.
			'action_type' => 'paid_membership', // TODO: is this okay? The Checkout Button Block can technically be used for ANY Woo product.
			'referer'     => $referer,
			'amount'      => $price,
			'currency'    => $currency,
			'product_id'  => $product_id,
			'recurrence'  => self::get_purchase_recurrrence( $product_id ),
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
			'action'      => self::FORM_SUBMISSION, // not sure if needed/correct here? Fires when modal opens, not when form is submitted.
			'action_type' => 'donation',
			'referer'     => $referer,
			'amount'      => $price,
			'currency'    => $currency,
			'product_id'  => $product_id,
			'recurrence'  => self::get_purchase_recurrrence( $product_id ),
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
		$order_id = $order->get_id();
		$data = [
			'action'   => self::FORM_SUBMISSION, // Replaces a 'is_checkout_attempt tracking?
			'order_id' => $order_id,
		];
		return $data;
	}

	/**
	 * TODO: trying to nail down when the Continue button is clicked.
	 *
	 * @return ?array
	 */
	public static function modal_pagination() {
		/*
		$data = [
			'modal_pagination' => 'TK', // returns 2, 3, etc.
		];
		return $data;
		*/

		if ( empty( $_REQUEST['newspack_modal_checkout_submit_billing_details'] ) ) {
			return;
		}
		error_log( '##############CONTINUE BUTTON CLICKED' );
	}
}
Modal_Checkout::init();
