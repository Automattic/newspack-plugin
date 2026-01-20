/* globals jQuery, newspackGroupSubscriptions */

/**
 * Group Subscriptions admin JS.
 */

import './admin.scss';

( function ( $ ) {
	if ( ! $ ) {
		return;
	}

	// Initialize UI elements.
	function init() {
		$( 'input#_newspack_group_subscription_enabled' ).trigger( 'change' );
		const $select = $( '#_newspack_group_subscription_member_ids' );
		$select.select2( {
			ajax: {
				url: `${ newspackGroupSubscriptions.apiUrl }/search-users`,
				beforeSend( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', newspackGroupSubscriptions.apiNonce );
				},
				type: 'POST',
				delay: 2000,
				data( params ) {
					const subscriptionId = $select.closest( '.newspack-group-subscription--container' ).data( 'subscription-id' );
					return {
						search: params.term,
						subscription_id: subscriptionId,
					};
				},
				processResults( data ) {
					return {
						results: data,
					};
				},
				error( xhr, status, error ) {
					const errorMessage = xhr.responseJSON?.message || error;
					if ( errorMessage === 'abort' ) {
						return;
					}
					$select.before( `<mark class="error"><span class="dashicons dashicons-warning"></span>${ errorMessage }</mark>` );
				},
				cache: true,
			},
			closeOnSelect: true,
			minimumInputLength: 2,
			placeholder: newspackGroupSubscriptions.placeholder,
			allowClear: true,
		} );
		$select.on( 'select2:opening', function () {
			$select.parent().find( '.error' ).remove();
		} );
	}

	// Show or hide group subscription options based on the enabled checkbox.
	function showOrHideOptions( e ) {
		const $metabox = $( e.currentTarget ).closest( '#newspack-group-subscription' );
		if ( $( e.currentTarget ).is( ':checked' ) ) {
			$metabox.addClass( 'enabled' );
		} else {
			$metabox.removeClass( 'enabled' );
		}
	}

	// Add member by ID to a group subscription.
	function addMember( e ) {
		e.preventDefault();
		const $select = $( e.currentTarget );
		$select.attr( 'disabled', true );
		const subscriptionId = $select.closest( '.newspack-group-subscription--container' ).data( 'subscription-id' );
		const memberToAdd = $select.val();
		if ( ! memberToAdd || ! subscriptionId ) {
			return;
		}
		fetch( `${ newspackGroupSubscriptions.apiUrl }/members`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': newspackGroupSubscriptions.apiNonce,
			},
			body: JSON.stringify( { subscription_id: subscriptionId, members_to_add: [ memberToAdd ] } ),
		} )
			.then( response => response.json() )
			.then( data => {
				if ( data.code && data.message && data.message !== 'abort' ) {
					throw new Error( data.message );
				}
				if ( data.members_added?.[ memberToAdd ] ) {
					const $membersList = $( '.newspack-group-subscription--members-list' );
					const $membersCount = $select
						.closest( '.newspack-group-subscription--container' )
						.find( '.newspack-group-subscription--members-count' );
					if ( $membersCount.length ) {
						$membersCount.text( parseInt( $membersCount.text() ) + 1 );
					}
					$membersList.append(
						`<li><a class="newspack-group-subscription--member-user-link" href="#"></a><a href="#" class="newspack-group-subscription--remove-member">&#215; <span class="screen-reader-text">Remove</span></a></li>`
					);
					const $added = $membersList.find( 'li' ).last();
					$added
						.find( '.newspack-group-subscription--member-user-link' )
						.text( data.members_added[ memberToAdd ].email )
						.attr( 'href', data.members_added[ memberToAdd ].url );
					$added.find( ' .newspack-group-subscription--remove-member' ).data( 'user-id', memberToAdd );
				}
			} )
			.catch( error => {
				$select.before( `<mark class="error"><span class="dashicons dashicons-warning"></span><span class="message"></span></mark>` );
				$select.parent().find( '.message' ).text( error.message );
			} )
			.finally( () => {
				$select.val( null ).trigger( 'change' );
				$select.attr( 'disabled', false );
			} );
	}

	// Remove member from a group subscription.
	function removeMember( e ) {
		e.preventDefault();
		const $this = $( e.currentTarget );
		const userId = $this.data( 'user-id' );
		const subscriptionId = $this.closest( '.newspack-group-subscription--container' ).data( 'subscription-id' );
		if ( ! userId || ! subscriptionId ) {
			return;
		}
		const $listItem = $this.closest( 'li' );
		$listItem.addClass( 'newspack-group-subscription--to-remove' );
		$listItem.find( '.error' ).remove();
		fetch( `${ newspackGroupSubscriptions.apiUrl }/members`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': newspackGroupSubscriptions.apiNonce,
			},
			body: JSON.stringify( { subscription_id: subscriptionId, members_to_remove: [ userId ] } ),
		} )
			.then( response => response.json() )
			.then( data => {
				if ( data.code && data.message && data.message !== 'abort' ) {
					throw new Error( data.message );
				}
				if ( data.members_removed?.[ userId ] ) {
					const $membersCount = $listItem
						.closest( '.newspack-group-subscription--members' )
						.find( '.newspack-group-subscription--members-count' );

					if ( $membersCount.length ) {
						$membersCount.text( parseInt( $membersCount.text() ) - 1 );
					}
					$listItem.remove();
				}
			} )
			.catch( error => {
				$this.after( `<mark class="error"><span class="dashicons dashicons-warning"></span><span class="message"></span></mark>` );
				$this.parent().find( '.message' ).text( error.message );
			} )
			.finally( () => {
				$this.parent().removeClass( 'newspack-group-subscription--to-remove' );
			} );
	}
	$( '#newspack-group-subscription' ).on( 'change', 'input#_newspack_group_subscription_enabled', showOrHideOptions );
	$( '#newspack-group-subscription' ).on( 'change', '#_newspack_group_subscription_member_ids', addMember );
	$( '#newspack-group-subscription' ).on( 'click', '.newspack-group-subscription--remove-member', removeMember );

	$( document ).ready( init );
} )( jQuery );
