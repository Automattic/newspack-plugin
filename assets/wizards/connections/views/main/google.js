/**
 * External dependencies.
 */
import qs from 'qs';

/**
 * WordPress dependencies.
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies.
 */
import { ActionCard, Button } from '../../../../components/src';

const getURLParams = () => {
	return qs.parse( window.location.search.replace( /^\?/, '' ) );
};

const GoogleOAuth = ( { setError, onInit, onSuccess } ) => {
	const [ authState, setAuthState ] = useState( {} );

	const userBasicInfo = authState.user_basic_info;

	const [ inFlight, setInFlight ] = useState( false );
	const [ localError, setLocalError ] = useState( null );
	const handleError = res => {
		const message = res.message || __( 'Something went wrong.', 'newspack' );
		setLocalError( message );
		if ( typeof setError === 'function' ) {
			setError( message );
		}
	};

	const isConnected = Boolean( userBasicInfo && userBasicInfo.email );

	useEffect( () => {
		if ( isConnected && ! userBasicInfo.has_refresh_token ) {
			setError( [
				__( 'Missing Google refresh token. Please', 'newspack' ),
				' ',
				<a
					key="link"
					target="_blank"
					rel="noreferrer"
					href="https://myaccount.google.com/permissions"
				>
					{ __( 'revoke credentials', 'newspack' ) }
				</a>,
				' ',
				__( 'and authorise the site again.', 'newspack' ),
			] );
		}
	}, [ isConnected ] );

	const getCurrentAuth = () => {
		const params = getURLParams();
		if ( ! params.access_token ) {
			let error = null;
			setInFlight( true );
			apiFetch( { path: '/newspack/v1/oauth/google' } )
				.then( data => {
					setAuthState( data );
					setError();
					setLocalError();
					if ( data?.user_basic_info && typeof onSuccess === 'function' ) {
						onSuccess( data );
					}
				} )
				.catch( err => {
					error = err;
					handleError( err );
				} )
				.finally( () => {
					setInFlight( false );
					if ( typeof onInit === 'function' ) {
						onInit( error );
					}
				} );
		}
	};

	useEffect( getCurrentAuth, [] );

	const openAuth = () => {
		const authWindow = window.open(
			'about:blank',
			'newspack_google_oauth',
			'width=500,height=600'
		);
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/oauth/google/start',
		} )
			.then( url => {
				/** authWindow can be 'null' due to browser's popup blocker. */
				if ( authWindow ) {
					authWindow.location = url;
					const interval = setInterval( () => {
						if ( authWindow?.closed ) {
							clearInterval( interval );
							getCurrentAuth();
						}
					}, 500 );
				}
			} )
			.catch( err => {
				if ( authWindow ) {
					authWindow.close();
				}
				handleError( err );
				setInFlight( false );
			} );
	};

	// Redirect user to Google auth screen.
	const disconnect = () => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/oauth/google/revoke',
			method: 'DELETE',
		} )
			.then( () => {
				setAuthState( {} );
				setError();
				setLocalError();
			} )
			.catch( handleError )
			.finally( () => setInFlight( false ) );
	};

	const getDescription = () => {
		if ( localError ) {
			return localError;
		}
		if ( inFlight ) {
			return __( 'Loading…', 'newspack' );
		}
		if ( isConnected ) {
			return sprintf(
				// Translators: connected user's email address.
				__( 'Connected as %s', 'newspack' ),
				userBasicInfo.email
			);
		}
		return __( 'Not connected', 'newspack' );
	};

	return (
		<ActionCard
			title={ __( 'Google', 'newspack' ) }
			description={ `${ __( 'Status:', 'newspack' ) } ${ getDescription() }` }
			checkbox={ isConnected ? 'checked' : 'unchecked' }
			actionText={
				<Button
					isLink
					isDestructive={ isConnected }
					onClick={ isConnected ? disconnect : openAuth }
					disabled={ inFlight }
				>
					{ isConnected ? __( 'Disconnect', 'newspack' ) : __( 'Connect', 'newspack' ) }
				</Button>
			}
			isMedium
		/>
	);
};

export default GoogleOAuth;
