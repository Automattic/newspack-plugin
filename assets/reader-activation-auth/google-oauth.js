/* globals newspack_reader_auth_labels */

/**
 * Internal dependencies.
 */
import { domReady, convertFormDataToObject } from './utils';

domReady( function () {
	const loginsElements = document.querySelectorAll( '.newspack-reader__logins' );
	[ ...loginsElements ].forEach( element => {
		element.classList.remove( 'newspack-reader__logins--disabled' );
	} );
	const googleLoginElements = document.querySelectorAll( '.google-oauth' );
	googleLoginElements.forEach( googleLoginElement => {
		const googleLoginForm = googleLoginElement.closest( 'form' );
		const checkLoginStatus = metadata => {
			fetch( `/wp-json/newspack/v1/login/google/register?metadata=${ JSON.stringify( metadata ) }` )
				.then( res => {
					res
						.json()
						.then( ( { message, data } ) => {
							if ( googleLoginForm?.endLoginFlow ) {
								googleLoginForm.endLoginFlow( message, res.status, data );
							}
						} )
						.catch( error => {
							if ( googleLoginForm?.endLoginFlow ) {
								googleLoginForm.endLoginFlow( error?.message, res.status );
							}
						} );
				} )
				.catch( error => {
					if ( googleLoginForm?.endLoginFlow ) {
						googleLoginForm.endLoginFlow( error?.message );
					}
				} );
		};

		googleLoginElement.addEventListener( 'click', () => {
			if ( googleLoginForm?.startLoginFlow ) {
				googleLoginForm.startLoginFlow();
			}

			const metadata = googleLoginForm
				? convertFormDataToObject( new FormData( googleLoginForm ), [ 'lists[]' ] )
				: {};
			metadata.current_page_url = window.location.href;
			const authWindow = window.open(
				'about:blank',
				'newspack_google_login',
				'width=500,height=600'
			);
			fetch( '/wp-json/newspack/v1/login/google' )
				.then( res => res.json().then( data => Promise.resolve( { data, status: res.status } ) ) )
				.then( ( { data, status } ) => {
					if ( status !== 200 ) {
						if ( authWindow ) {
							authWindow.close();
						}
						if ( googleLoginForm?.endLoginFlow ) {
							googleLoginForm.endLoginFlow( data.message, status );
						}
					} else if ( authWindow ) {
						authWindow.location = data;
						const interval = setInterval( () => {
							if ( authWindow.closed ) {
								checkLoginStatus( metadata );
								clearInterval( interval );
							}
						}, 500 );
					} else if ( googleLoginForm?.endLoginFlow ) {
						googleLoginForm.endLoginFlow( newspack_reader_auth_labels.blocked_popup );
					}
				} )
				.catch( error => {
					console.log( error );
					if ( googleLoginForm?.endLoginFlow ) {
						googleLoginForm.endLoginFlow( error?.message, 400 );
					}
					if ( authWindow ) {
						authWindow.close();
					}
				} );
		} );
	} );
} );
