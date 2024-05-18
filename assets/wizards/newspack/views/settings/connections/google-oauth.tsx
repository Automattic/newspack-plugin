/**
 * Settings Wizard: Connections > Google OAuth
 */

/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Button } from '../../../../../components/src';
import WizardsActionCard from '../../../../wizards-action-card';
import useWizardError from '../../../../hooks/use-wizard-error';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

const getURLParams = () => {
	const searchParams = new URLSearchParams( window.location.search );
	const params: { [ key: string ]: string } = {};
	for ( const [ key, value ] of searchParams.entries() ) {
		params[ key ] = value;
	}
	return params;
};

const GoogleOAuth = ( {
	onSuccess,
	isOnboarding,
}: {
	onInit?: ( str: Error | null ) => void;
	onSuccess?: ( arg: OAuthData ) => void;
	isOnboarding?: ( str: string ) => void;
} ) => {
	const [ authState, setAuthState ] = useState< OAuthData >( {} );

	const userBasicInfo = authState?.user_basic_info;

	const { wizardApiFetch, isFetching: inFlight } = useWizardApiFetch();
	const { error, setError, resetError } = useWizardError(
		'newspack/settings',
		'connections/apis/googleoauth'
	);

	const isConnected = Boolean( userBasicInfo && userBasicInfo.email );

	useEffect( () => {
		if ( isConnected && userBasicInfo && ! userBasicInfo.has_refresh_token ) {
			setError(
				__( 'Missing Google refresh token. Please re-authenticate site.', 'newspack-plugin' )
			);
		}
	}, [ isConnected ] );

	const getCurrentAuth = () => {
		const params = getURLParams();
		if ( ! params.access_token ) {
			wizardApiFetch< OAuthData >(
				{
					path: '/newspack/v1/oauth/google',
				},
				{
					onSuccess( data ) {
						setAuthState( data );
						if ( data?.user_basic_info ) {
							if ( typeof onSuccess === 'function' ) {
								onSuccess( data );
							}
							resetError();
						}
					},
					onError( e ) {
						setError( e );
					},
				}
			);
		}
	};

	// We only want to autofetch the current auth state if we're not onboarding.
	useEffect( () => {
		if ( ! isOnboarding ) {
			getCurrentAuth();
		}
	}, [] );

	const openAuth = () => {
		const authWindow = window.open(
			'about:blank',
			'newspack_google_oauth',
			'width=500,height=600'
		);
		wizardApiFetch< string >(
			{
				path: '/newspack/v1/oauth/google/start',
				isLocalError: true,
			},
			{
				onSuccess( url ) {
					/** authWindow can be 'null' due to browser's popup blocker. */
					if ( authWindow ) {
						authWindow.location = url;
						const interval = setInterval( () => {
							if ( authWindow?.closed ) {
								clearInterval( interval );
								getCurrentAuth();
								resetError();
							}
						}, 500 );
					}
				},
				onError( e ) {
					if ( authWindow ) {
						authWindow.close();
					}
					setError( e );
				},
			}
		);
	};

	// Redirect user to Google auth screen.
	const disconnect = () => {
		wizardApiFetch< void >(
			{
				path: '/newspack/v1/oauth/google/revoke',
				method: 'DELETE',
			},
			{
				onSuccess() {
					setAuthState( {} );
					resetError();
				},
				onError( e ) {
					setError( e );
				},
			}
		);
	};

	const getDescription = () => {
		if ( inFlight ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		if ( isConnected ) {
			return sprintf(
				// Translators: connected user's email address.
				__( 'Connected as %s', 'newspack-plugin' ),
				userBasicInfo?.email
			);
		}
		return __( 'Not connected', 'newspack-plugin' );
	};

	return (
		<WizardsActionCard
			title={ __( 'Google', 'newspack-plugin' ) }
			description={ getDescription() }
			isChecked={ isConnected }
			actionText={
				<Button
					isLink
					isDestructive={ isConnected }
					onClick={ isConnected ? disconnect : openAuth }
					disabled={ inFlight }
				>
					{ isConnected
						? __( 'Disconnect', 'newspack-plugin' )
						: __( 'Connect', 'newspack-plugin' ) }
				</Button>
			}
			error={ error }
			isMedium
		/>
	);
};

export default GoogleOAuth;
