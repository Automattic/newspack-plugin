( function ( $ ) {
	$( 'body' ).click( function ( ev ) {
		$.post( newspack_ga4_poc.ajax_url, {
			action: 'ga4_trigger_event',
			_ajax_nonce: newspack_ga4_poc.poc_nonce,
			params: {
				event_name: 'click_body',
				event_params: {
					position_x: ev.pageX,
					position_y: ev.pageY,
				},
			},
		} );
	} );
} )( jQuery );
