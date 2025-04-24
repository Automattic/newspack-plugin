/* globals newspack_my_account */
/**
 * Internal dependencies.
 */
import { domReady, registerElementActivity } from '../utils';

/**
 * Get the subscription ID from the element's href attribute.
 *
 * @param {Element} element The element to get the subscription ID from.
 *
 * @return {string|null} The subscription ID or null if no subscription ID is found.
 */
const getSubscriptionIdFromHref = element => {
	const match = element
		.getAttribute( 'href' )
		.match( /subscription_id=(\d+)/ );
	return match ? match[ 1 ] : null;
};

const url = new URL( window.location.href );

domReady( function () {
	// Track when the user cancels a subscription.
	registerElementActivity(
		'.subscription_details .button.cancel',
		'subscription_cancelled',
		element => ( {
			subscription_id: getSubscriptionIdFromHref( element ),
		} )
	);

	// Track when the user reactivates a subscription.
	registerElementActivity(
		'.subscription_details .button.reactivate',
		'subscription_reactivated',
		element => ( {
			subscription_id: getSubscriptionIdFromHref( element ),
		} )
	);

	// Track when a user switches a subscription (upgrade or downgrade).
	if ( newspack_my_account.is_switch_subscription_checkout_page ) {
		// Block checkout is react, so we need to wait for the form to be rendered.
		wp?.hooks?.addAction(
			'experimental__woocommerce_blocks-checkout-render-checkout-form',
			'newspack/my-account/activity',
			() => {
				registerElementActivity(
					'.wc-block-components-checkout-place-order-button',
					'subscription_switched'
				);
			}
		);
		// Shortcode checkout.
		registerElementActivity(
			'form[name="checkout"]',
			'subscription_switched'
		);
	}

	// Track when a payment method is deleted.
	registerElementActivity(
		'.payment-method .button.delete',
		'payment_method_deleted'
	);

	// Track when a payment method is added.
	registerElementActivity(
		'form#add_payment_method',
		'payment_method_added',
		element => ( {
			payment_method: element.querySelector(
				'input[name="payment_method"]'
			)?.value,
		} )
	);

	// Track when the user changes the payment method for a subscription via the checkout page.
	const orderReviewForm = document.querySelector( '#order_review' );
	const changePaymentInput = orderReviewForm?.querySelector(
		'input[name="woocommerce_change_payment"]'
	);
	if ( orderReviewForm && changePaymentInput ) {
		registerElementActivity(
			orderReviewForm,
			'payment_method_changed',
			() => ( {
				subscription_id: changePaymentInput.value,
				update_all_subscriptions: orderReviewForm.querySelector(
					'#update_all_subscriptions_payment_method'
				)?.checked,
			} )
		);
	}

	// Track when the user updates their billing or shipping address.
	if ( url.pathname.includes( 'edit-address' ) ) {
		registerElementActivity(
			'.woocommerce-MyAccount-content form',
			'address_updated',
			() => ( {
				address_type: url.pathname.includes( 'billing' )
					? 'billing'
					: 'shipping',
			} )
		);
	}
} );
