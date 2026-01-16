/* globals jQuery, newspackGroupSubscriptions, ajaxurl */

/**
 * Group Subscriptions admin JS.
 */

import './admin.scss';

( function ( $ ) {
	if ( ! $ ) {
		return;
	}

	function init() {
		$( 'input#_newspack_group_subscription_enabled' ).trigger( 'change' );
		const $select = $( '#_newspack_group_subscription_member_ids' );
		const ownerId = $select.data( 'owner-id' );
		$select.select2( {
			ajax: {
				url: ajaxurl,
				dataType: 'json',
				type: 'POST',
				delay: 1000,
				data( params ) {
					const exclude = $select.val()
						? $select.val().map( function ( item ) {
								return parseInt( item );
						  } )
						: [];
					if ( ownerId ) {
						exclude.push( parseInt( ownerId ) );
					}
					return {
						action: 'newspack_group_subscription_search_users',
						exclude,
						search: params.term,
						nonce: newspackGroupSubscriptions.nonce,
					};
				},
				processResults( data ) {
					return {
						results: data,
					};
				},
				cache: true,
			},
			minimumInputLength: 2,
			placeholder: newspackGroupSubscriptions.placeholder,
			allowClear: true,
		} );
		$( '.newspack-group-subscription--remove-member' ).click( function ( e ) {
			e.preventDefault();
			const $this = $( this );
			const $li = $this.closest( 'li' );
			const $input = $( '#newspack_group_subscription_member_ids_to_remove' );
			const idsToRemove = $input.val() ? $input.val().split( ',' ) : [];
			const userId = $this.data( 'user-id' );
			if ( $li.hasClass( 'newspack-group-subscription--to-remove' ) ) {
				$( e.currentTarget ).html( '&#215;' );
				$li.removeClass( 'newspack-group-subscription--to-remove' );
				$input.val( idsToRemove.filter( id => parseInt( id ) !== parseInt( userId ) ).join( ',' ) );
				return;
			}
			$( e.currentTarget ).html( '&#8634;' );
			$li.addClass( 'newspack-group-subscription--to-remove' );
			idsToRemove.push( userId );
			$input.val( idsToRemove.join( ',' ) );
		} );
	}

	function showOrHideOptions( e ) {
		const $metabox = $( e.currentTarget ).closest( '#newspack-group-subscription' );
		if ( $( e.currentTarget ).is( ':checked' ) ) {
			$metabox.addClass( 'enabled' );
		} else {
			$metabox.removeClass( 'enabled' );
		}
	}

	$( '#newspack-group-subscription' ).on( 'change', 'input#_newspack_group_subscription_enabled', showOrHideOptions );
	$( document ).ready( init );
} )( jQuery );
