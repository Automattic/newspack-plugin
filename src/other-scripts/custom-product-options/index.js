/* globals jQuery */
( function ( $ ) {
	if ( ! $ ) {
		return;
	}

	function init() {
		$( 'input#_newspack_group_subscription_enabled,input.variable_newspack_group_subscription_enabled' ).trigger( 'change' );
		$( '#woocommerce-product-data' ).on( 'woocommerce_variations_loaded', init );
		$( '.woocommerce_variation' ).on( 'click', 'h3', init );
	}

	function showOrHideGroupSubscriptionOptions( e ) {
		const $items = $( e.currentTarget ).hasClass( 'variable_newspack_group_subscription_enabled' )
			? $( e.currentTarget ).closest( '.woocommerce_variation' ).find( '.show_if_newspack_group_subscription_enabled' )
			: $( e.currentTarget ).closest( '#woocommerce-product-data' ).find( '.show_if_newspack_group_subscription_enabled' );

		if ( $( e.currentTarget ).is( ':checked' ) ) {
			$items.show();
		} else {
			$items.hide();
		}
	}

	$( '#woocommerce-product-data' ).on(
		'change',
		'input#_newspack_group_subscription_enabled,input.variable_newspack_group_subscription_enabled',
		showOrHideGroupSubscriptionOptions
	);

	$( document ).ready( init );
} )( jQuery );
