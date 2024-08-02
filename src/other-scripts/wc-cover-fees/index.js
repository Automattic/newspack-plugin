/* globals jQuery, newspack_wc_cover_fees */
( function ( $ ) {
	if ( ! $ ) {
		return;
	}
	const $body = $( document.body );
	$body.on( 'init_checkout', function () {
		const form = document.querySelector( 'form.checkout' );
		if ( ! form ) {
			return;
		}
		let checked = document.getElementById( newspack_wc_cover_fees.custom_field_name )?.checked;
		form.addEventListener( 'change', function () {
			// Get element on every change because the DOM is replaced by AJAX.
			const input = document.getElementById( newspack_wc_cover_fees.custom_field_name );
			if ( ! input ) {
				return;
			}
			if ( checked !== input.checked ) {
				checked = input.checked;
				$body.trigger( 'update_checkout', { update_shipping_method: false } );
			}
		} );
		// Trigger checkout update on payment method change so it updates the fee.
		$( document ).on( 'payment_method_selected', function () {
			$body.trigger( 'update_checkout', { update_shipping_method: false } );
		} );
	} );
} )( jQuery );
