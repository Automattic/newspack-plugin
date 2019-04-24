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

	/**
	 * Media modal when editing or creating a subscription.
	 */
	function subscription_image_uploader() {
		var frame = false;
		var $add_image = $( '.image-fields .add-image' );
		var $del_image = $( '.image-fields .delete-image' );
		var $img_preview = $( '.image-fields .image-preview' );
		var $img_form_input = $( '.image-fields .image-form-input' );

		if ( '0' !== $img_form_input.val() ) {
			$add_image.hide();
		} else {
			$del_image.hide();
		}

		$add_image.on( 'click', function( evt ) {
			evt.preventDefault();

			if ( frame ) {
				frame.open();
				return;
			}

			frame = wp.media( {
				title: 'Select or upload image',
				button: {
					text: 'Select'
				},
				library: {
					type: 'image'
				},
				multiple: false
			} );

			frame.on( 'select', function() {
				var attachment = frame.state().get( 'selection' ).first().toJSON();
      			$img_preview.find( 'img' ).attr( 'src', attachment.url );
				$img_form_input.val( attachment.id );
				$add_image.hide();
				$del_image.show();
    		} );

    		frame.open();
		} );

  		$del_image.on( 'click', function( evt ){
    		evt.preventDefault();
    		$img_preview.find( 'img' ).attr( 'src', $img_preview.data( 'default' ) );
    		$img_form_input.val( 0 );
    		$add_image.show();
    		$del_image.hide();
		} );

	}
	if ( $( '.image-fields' ).length ) {
		subscription_image_uploader();
	}

} )( jQuery );