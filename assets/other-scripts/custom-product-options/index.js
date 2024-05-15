/* globals jQuery */
( function ( $ ) {
	if ( ! $ ) {
		return;
	}
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
} )( jQuery );
