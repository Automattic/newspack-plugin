/* globals jQuery */
( function( $ ) {
	if ( ! $ ) {
		return;
	}

	/**
	 * Hide the 'Virtual' checkbox for variable products.
	 */
	$( '#variable_product_options' ).on( 'change', 'input.variable_is_virtual', function ( e ) {
		$( e.currentTarget )
			.closest( '.woocommerce_variation' )
			.find( '.show_if_variation_virtual' )
			.hide();

		if ( $( e.currentTarget ).is( ':checked' ) ) {
			$( e.currentTarget )
				.closest( '.woocommerce_variation' )
				.find( '.show_if_variation_virtual' )
				.show();
		}
	} );

	/**
	 * Handle 'Allow to be gifted' checkbox visibility and state.
	 */
	function handleGiftingCheckbox() {
		const $giftingCheckbox = $( '#_newspack_allow_gifting' );
		const $subscriptionLimit = $( '#_subscription_limit' ).val();
		const $productType = $( '#product-type' ).val();
		const $giftingLabel = $giftingCheckbox.closest( 'label' );

		// If there's no subscription limit and the product type is subscription-related, show the gifting checkbox.
		if ( 'no' === $subscriptionLimit && ( $productType === 'subscription' || $productType === 'variable-subscription' ) ) {
			$giftingLabel.show();

			// Restore previous state of the checkboxif it exists
			const previousState = $giftingCheckbox.data( 'previous-state' );
			if ( previousState !== undefined ) {
				// If undefined, switch it to the default (unchecked) state.
				$giftingCheckbox.prop( 'checked', previousState );
				$giftingCheckbox.removeData( 'previous-state' );
			}
		} else {
			// Store current state before hiding.
			$giftingCheckbox.data( 'previous-state', $giftingCheckbox.prop( 'checked' ) );
			$giftingCheckbox.prop( 'checked', false );
			$giftingLabel.hide();
		}
	}

	// Initialize when document is ready.
	$( document ).ready( function() {
		handleGiftingCheckbox();

		// Update when subscription limit changes.
		$( '#_subscription_limit' ).on( 'change', handleGiftingCheckbox );
		// Update when product type changes (switching to and away from subscription products).
		$( '#product-type' ).on( 'change', handleGiftingCheckbox );
	} );
} )( jQuery );
