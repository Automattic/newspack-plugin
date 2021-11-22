/* global newspack_connections_data */

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

export const handleGoogleRedirect = ( { setError } ) => {
	const params = getURLParams();
	if ( params.access_token ) {
		return apiFetch( {
			path: '/newspack/v1/oauth/google/finish',
			method: 'POST',
			data: {
				access_token: params.access_token,
				refresh_token: params.refresh_token,
				csrf_token: params.csrf_token,
				expires_at: params.expires_at,
			},
		} )
			.then( () => {
				params.access_token = undefined;
				params.refresh_token = undefined;
				params.csrf_token = undefined;
				params.expires_at = undefined;
				window.location.search = qs.stringify( params );
			} )
			.catch( e => {
				setError(
					e.message || __( 'Something went wrong during authentication with Google.', 'newspack' )
				);
			} );
	}
	return Promise.resolve();
};

const GoogleOAuth = ( { setError } ) => {
	const [ authState, setAuthState ] = useState( {} );

	const userBasicInfo = authState.user_basic_info;
	const canUseOauth = newspack_connections_data.can_connect_google;

	const [ inFlight, setInFlight ] = useState( false );
	const handleError = res => setError( res.message || __( 'Something went wrong.', 'newspack' ) );

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

	useEffect( () => {
		const params = getURLParams();
		if ( canUseOauth && ! params.access_token ) {
			setInFlight( true );
			apiFetch( { path: '/newspack/v1/oauth/google' } )
				.then( setAuthState )
				.catch( handleError )
				.finally( () => setInFlight( false ) );
		}
	}, [] );

	if ( ! canUseOauth ) {
		return null;
	}

	// Redirect user to Google auth screen.
	const goToAuthPage = () => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/oauth/google/start',
		} )
			.then( url => ( window.location = url ) )
			.catch( handleError );
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
				setInFlight( false );
			} )
			.catch( handleError );
	};

	const getDescription = () => {
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
			description={ getDescription() }
			checkbox={ isConnected ? 'checked' : 'unchecked' }
			actionText={
				<Button
					isLink
					isDestructive={ isConnected }
					onClick={ isConnected ? disconnect : goToAuthPage }
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
