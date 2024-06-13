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
	 * TODO: Add some words here.
	 *
	 * @param string $price Purchase price.
	 * @param string $product_id Purchased product ID.
	 * @param string $referer Purchased product referer.
	 *
	 * @return ?array
	 */
	public static function checkout_button_purchase( $price, $product_id, $referer ) {
		$data = [
			'action'              => self::FORM_SUBMISSION,
			'action_type'         => 'registration',
			'referer'             => $referer,
			'checkout_price'      => $price,
			'checkout_product_id' => $product_id,
			'checkout_trigger'    => 'checkout_button',
		];
		return $data;
	}

	/**
	 * TODO: Add some words here.
	 *
	 * @param string $price Donation price.
	 * @param string $product_id Donation product ID.
	 * @param string $referer Donation referrer.
	 *
	 * @return ?array
	 */
	public static function donate_button_purchase( $price, $product_id, $referer ) {
		$data = [
			'action'              => self::FORM_SUBMISSION,
			'action_type'         => 'registration',
			'referer'             => $referer,
			'checkout_price'      => $price,
			'checkout_product_id' => $product_id,
			'checkout_trigger'    => 'donate_button',
		];
		return $data;
	}

	/**
	 * TODO: Add some words here.
	 *
	 * @return ?array
	 */
	public static function checkout_attempt() {
		$data = [
			'is_checkout_attempt' => 'yes',
		];
		return $data;
	}

	/**
	 * TODO: Add some words here.
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
