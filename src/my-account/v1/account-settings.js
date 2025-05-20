/**
 * Account settings (formerly Edit Account)
 */

import { domReady } from '../../utils';

domReady( function () {
	 // Show confirmation dialogs to delete account.
	 const deleteButton = document.querySelector( '#delete-account .newspack-ui__button' );
	 if ( deleteButton ) {
		 const confirmationModal = document.getElementById( 'newspack-my-account__delete-account' );
		 if ( confirmationModal ) {
			 const confirmDelete = event => {
				 event.preventDefault();
				 confirmationModal.setAttribute( 'data-state', 'open' );
			 };
			 deleteButton.addEventListener( 'click', confirmDelete );
		 }
	 }
} );
