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
	 * The rendered popups data.
	 *
	 * @var array
	 */
	protected static $modalCheckouts = [];

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

		/*
		Data_Events::register_listener(
			'newspack_blocks_donate_block_modal',
			'modal_checkout_interaction',
			[ __CLASS__, 'donate_button_purchase' ]
		);
		*/

		Data_Events::register_listener(
			'woocommerce_checkout_order_created',
			'modal_checkout_interaction',
			[ __CLASS__, 'checkout_attempt' ]
		);

		\add_action( 'wp_footer', [ __CLASS__, 'print_popups_data' ], 999 );
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
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
			'action'      => self::FORM_SUBMISSION_SUCCESS,
			'action_type' => 'paid_membership',
			'recurrence'  => self::get_purchase_recurrence( $metadata['product_id'] ),
		];

		$data = array_merge( $data, $metadata );

		// return $data;
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
			'action'      => self::FORM_SUBMISSION_SUCCESS,
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
	 *
	 * TODO: Move to front end -- check-out attempt
	 */
	public static function checkout_attempt( $order ) {
		$order_data = \Newspack\Data_Events\Utils::get_order_data( $order->get_id(), true );

		if ( empty( $order_data ) ) {
			return;
		}

		$data = [
			'action'     => self::FORM_SUBMISSION,
			'order_id'   => $order->get_id(),
			'amount'     => $order->get_total(),
			'currency'   => $order->get_currency(),
			'recurrence' => $order_data['recurrence'],
			'product_id' => $order_data['platform_data']['product_id'],
		];
		return $data;
	}

	/**
	 * Store the rendered popups data.
	 *
	 * @param array $popup The popup array representation.
	 * @return void
	 */
	/*
	public static function get_rendered_popups( $modalCheckout ) {
		$data = self::get_popup_metadata( $modalCheckout );
		if ( ! empty( $data['prompt_id'] ) ) {
			self::$modalCheckouts[ $data['prompt_id'] ] = $data;
		}
	}
	*/

	/**
	 * Output the rendered popups data as a JS variable.
	 *
	 * @return void
	 */
	public static function print_popups_data() {
		/*
		if ( empty( self::$popups ) ) {
			return;
		}
		$popups = array_map( [ __CLASS__, 'prepare_popup_params_for_ga' ], self::$popups );
		 */
		?>



		<script>
			var newspackModalCheckoutData = <?php echo \wp_json_encode( 'whatever' ); ?>;
		</script>
		<?php
	}

	// TODO: this is terrible, fix it.
	public static function enqueue_scripts() {
		wp_enqueue_script(
				'ga4',
				\Newspack\Newspack::plugin_url() . '/dist/ga4.js',
				[],
				NEWSPACK_PLUGIN_VERSION,
				true
		);
	}
}
Modal_Checkout::init();
