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
	// const FORM_SUBMISSION = 'form_submission_received';


	/**
	 * Initialize the class by registering the listeners.
	 *
	 * @return void
	 */

	public static function init() {
		Data_Events::register_listener(
			'wtf_am_i_doing',
			'modal_checkout_interaction',
			[ __CLASS__, 'test_function' ]
		);
	}

	/**
	 * @return ?array
	 */
	public static function test_function(  $price, $product_id, $trigger ) {
		// \Newspack\Logger::log( 'price:' . $price . ' product ID: ' . $product_id . ' trigger: ' . $trigger );
		$data['product']['price'] = $price;
		$data['product']['id'] = $product_id;
		$data['product']['purchase_source'] = $trigger;

		return $data;
	}
}

Modal_Checkout::init();
