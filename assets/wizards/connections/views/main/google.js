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

const GoogleOAuth = ( { canBeConnected } ) => {
	const [ authState, setAuthState ] = useState( {} );

	const userBasicInfo = authState.user_basic_info;
	const isConnected = Boolean( userBasicInfo && userBasicInfo.email );
	const canUseOauth = newspack_connections_data.can_connect_google;

	const [ inFlight, setInFlight ] = useState( false );

	useEffect( () => {
		const params = getURLParams();
		if ( canUseOauth && ! params.access_token ) {
			setInFlight( true );
			apiFetch( { path: '/newspack/v1/oauth/google' } ).then( res => {
				setAuthState( res );
				setInFlight( false );
			} );
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
		} ).then( url => ( window.location = url ) );
	};

	// Redirect user to Google auth screen.
	const disconnect = () => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/oauth/google/revoke',
			method: 'DELETE',
		} ).then( () => {
			setAuthState( {} );
			setInFlight( false );
		} );
	};

	const getDescription = () => {
		if ( inFlight ) {
			return __( 'Loading…', 'newspack' );
		}
		if ( isConnected ) {
			return sprintf( __( 'Connected as %s', 'newspack' ), userBasicInfo.email );
		}
		if ( ! canBeConnected ) {
			return __( 'First connect to WordPress.com', 'newspack' );
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
					disabled={ inFlight || ! canBeConnected }
				>
					{ isConnected ? __( 'Disconnect', 'newspack' ) : __( 'Connect', 'newspack' ) }
				</Button>
			}
			isMedium
		/>
	);
};

export default GoogleOAuth;
