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

		// WTF.
		Data_Events::register_listener(
			'template_redirect',
			'modal_checkout_interaction',
			[ __CLASS__, 'redirect_test' ]
		);
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
			'action'           => self::FORM_SUBMISSION,
			'action_type'      => 'purchase',
			'referer'          => $referer,
			'amount'           => $price,
			'currency'         => $currency,
			'product_id'       => $product_id,
			'checkout_trigger' => 'checkout_button_block',
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
			'action'           => self::FORM_SUBMISSION,
			'action_type'      => 'donation',
			'referer'          => $referer,
			'amount'           => $price,
			'currency'         => $currency,
			'product_id'       => $product_id,
			'checkout_trigger' => 'donate_block',
		];
		return $data;
	}

	/**
	 * Fires when a reader attempts to complete an order with the modal checkout.
	 *
	 * @return ?array
	 */
	public static function checkout_attempt() {
		$data = [
			'action'              => self::FORM_SUBMISSION,
			'is_checkout_attempt' => 'yes',
		];
		return $data;
	}

	/**
	 * TODO: trying to nail down when the Continue button is clicked.
	 *
	 * @return ?array
	 */
	public static function redirect_test() {
		\Newspack\Logger::log( 'This fires when the template is reloaded' );
		$data = [
			'trigger' => 'something_else',
		];
		return $data;
	}
}
Modal_Checkout::init();
