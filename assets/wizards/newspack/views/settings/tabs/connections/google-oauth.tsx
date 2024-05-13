/**
 * External dependencies.
 */
import qs from 'qs';

/**
 * WordPress dependencies.
 */
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, Wizard } from '../../../../../../components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../components/src/wizard/store';

const getURLParams = () => {
	return qs.parse( window.location.search.replace( /^\?/, '' ) );
};

const GoogleOAuth = ( {
	onInit,
	onSuccess,
	isOnboarding,
}: {
	onInit?: ( str: Error | null ) => void;
	onSuccess?: ( arg: OAuthData ) => void;
	isOnboarding?: ( str: string ) => void;
} ) => {
	const [ authState, setAuthState ] = useState< OAuthData >( {} );

	const userBasicInfo = authState?.user_basic_info;

	const [ inFlight, setInFlight ] = useState( false );
	const { wizardApiFetch, setDataPropError } = useDispatch( WIZARD_STORE_NAMESPACE );
	const error = Wizard.useWizardDataPropError( 'settings', 'connections/apis/googleoauth' );

	const handleError = ( res: { message: string } ) => {
		const message = res.message || __( 'Something went wrong.', 'newspack-plugin' );
		setDataPropError( {
			slug: 'settings',
			prop: 'connections/apis/googleoauth',
			value: message,
		} );
	};

	const isConnected = Boolean( userBasicInfo && userBasicInfo.email );

	useEffect( () => {
		if ( isConnected && userBasicInfo && ! userBasicInfo.has_refresh_token ) {
			setDataPropError( {
				slug: 'settings-connections',
				prop: 'apis-googleoauth',
				value: __(
					'Missing Google refresh token. Please re-authenticate site.',
					'newspack-plugin'
				),
			} );
		}
	}, [ isConnected ] );

	const getCurrentAuth = () => {
		const params = getURLParams();
		if ( ! params.access_token ) {
			setInFlight( true );
			wizardApiFetch< Promise< OAuthData > >( {
				isComponentFetch: true,
				path: '/newspack/v1/oauth/google',
			} )
				.then( data => {
					setAuthState( data );
					if ( data?.user_basic_info && typeof onSuccess === 'function' ) {
						onSuccess( data );
					}
				} )
				.catch( ( err: Error ) => {
					handleError( err );
				} )
				.finally( () => {
					setInFlight( false );
				} );
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
		setInFlight( true );
		wizardApiFetch< Promise< string > >( {
			path: '/newspack/v1/oauth/google/start',
			isComponentFetch: true,
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
		wizardApiFetch< Promise< void > >( {
			path: '/newspack/v1/oauth/google/revoke',
			method: 'DELETE',
			isComponentFetch: true,
		} )
			.then( () => {
				setAuthState( {} );
				// setLocalError( undefined );
			} )
			.catch( handleError )
			.finally( () => setInFlight( false ) );
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
		<ActionCard
			title={ __( 'Google', 'newspack-plugin' ) }
			description={ `${ __( 'Status:', 'newspack-plugin' ) } ${ getDescription() }` }
			checkbox={ isConnected ? 'checked' : 'unchecked' }
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
			notification={ error }
			notificationLevel="error"
			isMedium
		/>
	);
};

export default GoogleOAuth;
