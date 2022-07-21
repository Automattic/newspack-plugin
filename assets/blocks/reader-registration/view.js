/**
 * Internal dependencies
 */
import './style.scss';

( function ( readerActivation ) {
	if ( ! readerActivation ) {
		return;
	}
	[ ...document.querySelectorAll( '.newspack-registration' ) ].forEach( container => {
		const form = container.querySelector( 'form' );
		if ( ! form ) {
			return;
		}
		const messageElement = container.querySelector( '.newspack-registration__response' );
		const submitElement = form.querySelector( 'input[type="submit"]' );
		readerActivation.on( 'reader', ( { detail: { email } } ) => {
			if ( email ) {
				form.style.display = 'none';
			}
		} );

		const startLoginFlow = () => {
			messageElement.innerHTML = '';
			submitElement.disabled = true;
			container.classList.add( 'newspack-registration--in-progress' );
		};

		const endLoginFlow = ( message, status, data ) => {
			messageElement.innerHTML = '';
			container.classList.remove( 'newspack-registration--in-progress' );

			if ( ! message || ! status ) {
				return;
			}
			const messageNode = document.createElement( 'p' );
			messageNode.textContent = message;
			messageNode.className = `message status-${ status }`;
			if ( status === 200 ) {
				container.replaceChild( messageNode, form );
				container.classList.add( 'newspack-registration--success' );
				if ( data?.email ) {
					readerActivation.setReader( data.email );
				}
			} else {
				messageElement.appendChild( messageNode );
			}
		};

		form.addEventListener( 'submit', ev => {
			ev.preventDefault();
			const body = new FormData( form );
			if ( ! body.has( 'email' ) || ! body.get( 'email' ) ) {
				return;
			}
			startLoginFlow();
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
			} ).then( res => {
				submitElement.disabled = false;
				res.json().then( ( { message, data } ) => endLoginFlow( message, res.status, data ) );
			} );
		} );

		const googleLogin = container.querySelector( '#newspack-google-login' );
		if ( googleLogin ) {
			googleLogin.onclick = () => {
				startLoginFlow();
				const checkLoginStatus = () => {
					fetch( '/wp-json/newspack/v1/login/google/register', {
						headers: new Headers( {
							'X-WP-Nonce': window.newspack_reader_activation_data.nonce,
						} ),
					} ).then( res => {
						res.json().then( ( { message, data } ) => endLoginFlow( message, res.status, data ) );
					} );
				};
				fetch( '/wp-json/newspack/v1/login/google' )
					.then( res => res.json().then( data => Promise.resolve( { data, status: res.status } ) ) )
					.then( ( { data, status } ) => {
						if ( status !== 200 ) {
							endLoginFlow( data.message, status );
						} else {
							const authWindow = window.open(
								'about:blank',
								'newspack_google_login',
								'width=500,height=600'
							);
							if ( authWindow ) {
								authWindow.location = data;
								const interval = setInterval( () => {
									if ( authWindow.closed ) {
										checkLoginStatus();
										clearInterval( interval );
									}
								}, 500 );
							} else {
								endLoginFlow();
							}
						}
					} );
			};
		}
	} );
} )( window.newspackReaderActivation );
