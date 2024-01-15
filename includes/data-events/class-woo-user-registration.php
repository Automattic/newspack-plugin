<?php
/**
 * Newspack Data Events Woo Registration hooks.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events;

/**
 * Class that triggers a registration event with Newspack metadata for users registered during the Woocommerce checkout process.
 */
final class Woo_User_Registration {

	/**
	 * Whether the current request is processing a checkout.
	 *
	 * @var boolean
	 */
	private static $processing_checkout = false;

	/**
	 * Metadata to send with the registration event.
	 *
	 * @var array
	 */
	private static $metadata = [];

	/**
	 * Initialize the class.
	 *
	 * @return void
	 */
	public static function init() {
		// is processing checkout?
		add_action( 'woocommerce_checkout_process', [ __CLASS__, 'checkout_process' ] );

		// created a user?
		add_action( 'woocommerce_created_customer', [ __CLASS__, 'created_customer' ], 1 );
	}

	/**
	 * During the checkout process, set the processing_checkout flag and store metadata.
	 *
	 * @return void
	 */
	public static function checkout_process() {

		/**
		 * On Newspack\Donations::process_donation_form(), we add these values to the cart.
		 *
		 * Later, we add them to the order (Newspack\Donations::checkout_create_order_line_item()) and use it to send the metadata to Newspack on donation events.
		 *
		 * Here, we are going to read the same information from the cart and use it to send the metadata to Newspack on registration events.
		 */
		foreach ( \WC()->cart->get_cart() as $cart_item_key => $values ) {
			if ( ! empty( $values['newspack_popup_id'] ) ) {
				self::$metadata['newspack_popup_id'] = $values['newspack_popup_id'];
			}
			if ( ! empty( $values['referer'] ) ) {
				self::$metadata['referer'] = $values['referer'];
			}
		}

		self::$processing_checkout = true;
	}

	/**
	 * If a user was created during the checkout by Woo, fire an event.
	 *
	 * @param int $user_id The ID of the created user.
	 * @return void
	 */
	public static function created_customer( $user_id ) {
		if ( ! self::$processing_checkout ) {
			return;
		}

		$user = get_user_by( 'id', $user_id );

		if ( ! $user ) {
			return;
		}

		// If a user is created later on the request by woocommerce_created_customer(), it will at least have this data.
		self::$metadata['registration_method'] = 'woocommerce';

		// For modal checkout, the referer is actually what we want to capture as the registration page.
		if ( ! empty( self::$metadata['referer'] ) && method_exists( 'Newspack_Blocks\Modal_Checkout', 'is_modal_checkout' ) && \Newspack_Blocks\Modal_Checkout::is_modal_checkout() ) {
			self::$metadata['current_page_url'] = self::$metadata['referer'];
		}

		/**
		 * Action after registering and authenticating a reader via Woocommerce checkout.
		 *
		 * @param string         $email         Email address.
		 * @param false|int      $user_id       The created user id.
		 * @param array          $metadata      Metadata.
		 */
		\do_action( 'newspack_registered_reader_via_woo', $user->user_email, $user_id, self::$metadata );
	}
}

Woo_User_Registration::init();
