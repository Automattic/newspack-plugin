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
	 * The name of the action for form submissions
	 */
	const FORM_SUBMISSION_SUCCESS = 'form_submission_success';

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
	 * @param array $checkout_button_metadata Information about the purchase.
	 *
	 * @return ?array
	 */
	public static function checkout_button_purchase( $checkout_button_metadata ) {
		$metadata = [];
		foreach ( $checkout_button_metadata as $key => $value ) {
			$metadata[ $key ] = $value;
		}

		$data = [
			'action'      => self::FORM_SUBMISSION_SUCCESS, // Not sure if this is required, but set to 'success' since it fires when the modal opens.
			'action_type' => 'paid_membership',
			'recurrence'  => self::get_purchase_recurrence( $metadata['product_id'] ),
		];

		$data = array_merge( $data, $metadata );

		return $data;
	}

	/**
	 * Fires when a reader opens the modal checkout from a donate block.
	 *
	 * @param array $donation_metadata Information about the donation.
	 *
	 * @return ?array
	 */
	public static function donate_button_purchase( $donation_metadata ) {
		$metadata = [];
		foreach ( $donation_metadata as $key => $value ) {
			$metadata[ $key ] = $value;
		}

		$data = [
			'action'      => self::FORM_SUBMISSION_SUCCESS, // Not sure if this is required, but set to 'success' since it fires when the modal opens.
			'action_type' => 'donation',
			'recurrence'  => self::get_purchase_recurrence( $metadata['product_id'] ),
		];

		$data = array_merge( $data, $metadata );

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
	 * @param array $continue_metadata Information passed by action.
	 *
	 * @return ?array
	 */
	public static function modal_pagination( $continue_metadata ) {
		check_ajax_referer( 'newspack_checkout_continue' );

		$metadata = [];
		foreach ( $continue_metadata as $key => $value ) {
			$metadata[ $key ] = $value;
		}

		$data = [
			'action' => self::FORM_SUBMISSION,
		];

		$data = array_merge( $data, $metadata );

		return $data;
	}
}
Modal_Checkout::init();
