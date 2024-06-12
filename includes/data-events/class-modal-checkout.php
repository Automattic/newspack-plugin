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
			'newspack_checkout_button_modal',
			'modal_checkout_interaction',
			[ __CLASS__, 'checkout_button_purchase' ]
		);

		Data_Events::register_listener(
			'newspack_donate_block_modal',
			'modal_checkout_interaction',
			[ __CLASS__, 'donate_button_purchase' ]
		);

		Data_Events::register_listener(
			'woocommerce_checkout_order_created',
			'modal_checkout_interaction',
			[ __CLASS__, 'checkout_attempt' ]
		);
	}

	/**
	 * TODO: Add some words here
	 *
	 * @param string $price Purchase price.
	 * @param string $product_id Purchase product ID.
	 *
	 * @return ?array
	 */
	public static function checkout_button_purchase( $price, $product_id ) {
		$data = [
			'action'          => self::FORM_SUBMISSION,
			'action_type'     => 'registration',
			'referer'         => $metadata['referer'],
			'product_price'   => $price,
			'product_id'      => $product_id,
			'product_trigger' => 'checkout_button',
		];
		return $data;
	}

	/**
	 * TODO: Add some words here.
	 *
	 * @param string $price Donation price.
	 * @param string $product_id Donation product ID.
	 *
	 * @return ?array
	 */
	public static function donate_button_purchase( $price, $product_id ) {
		$data = [
			'action'          => self::FORM_SUBMISSION,
			'action_type'     => 'registration',
			'referer'         => $metadata['referer'],
			'product_price'   => $price,
			'product_id'      => $product_id,
			'product_trigger' => 'donate_button',
		];
		return $data;
	}

	/**
	 * TODO: Add some words here
	 *
	 * @return ?array
	 */
	public static function checkout_attempt() {
		$data = [
			'trigger' => 'checkout_attempt',
		];
		return $data;
	}
}
Modal_Checkout::init();
