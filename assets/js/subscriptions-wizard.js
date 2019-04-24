( function( $ ){

	/**
	 * Enable/disable different sections of Edit Subscription form depending on whether "Name your price" is checked.
	 */
	function update_form() {
		if ( $( '.choose_price-input').is( ':checked' ) ) {
			$( '.price-fields' ).find( 'input, select' ).attr( 'disabled', true );
			$( '.choose_price-fields' ).show();
			$( '.choose_price-fields .subscription_frequency-input' ).attr( 'disabled', false );
		} else {
			$( '.price-fields' ).find( 'input, select' ).attr( 'disabled', false );
			$( '.choose_price-fields' ).hide();
			$( '.choose_price-fields .subscription_frequency-input' ).attr( 'disabled', true );
		}
	};
	update_form();
	$( '.choose_price-input' ).on( 'change', update_form );

	/**
	 * Confirmation dialogue when deleting a subscription.
	 */
	 function confirm_subscription_delete( evt ) {
		evt.preventDefault();
		if ( confirm( 'Are you sure you want to delete "' + $( this ).data( 'subscription' ) + '"?' ) ) {
			window.location = evt.target.href;
		}
	};
	$( '.delete-subscription' ).on( 'click', confirm_subscription_delete );

} )( jQuery );