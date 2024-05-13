/**
 * WordPress dependencies.
 */
import { ENTER } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	Button,
	Card,
	Grid,
	Modal,
	Notice,
	TextControl,
	Wizard,
} from '../../../../../../components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../components/src/wizard/store';

const Mailchimp = ( { setError }: { setError: SetErrorCallback } ) => {
	const [ authState, setAuthState ] = useState< OAuthData >( {} );
	const [ isModalOpen, setisModalOpen ] = useState( false );
	const [ apiKey, setAPIKey ] = useState< string | undefined >();

	const { wizardApiFetch, setDataPropError } = useDispatch( WIZARD_STORE_NAMESPACE );
	const { error } = Wizard.useWizardDataProp( 'settings-connections', 'mailchimp' );
	const isLoading: boolean = useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).isQuietLoading()
	);

	const modalTextRef = useRef< HTMLDivElement >( null );
	const isConnected = Boolean( authState && authState.username );

	const handleError = ( res: Error ) =>
		setError( res || __( 'Something went wrong.', 'newspack-plugin' ) );

	const openModal = () => setisModalOpen( true );
	const closeModal = () => {
		setisModalOpen( false );
		setAPIKey( undefined );
	};

	// Check the Mailchimp connectivity status.
	useEffect( () => {
		console.log( { useEffect: apiKey } );
		wizardApiFetch< Promise< OAuthData > >( {
			isComponentFetch: true,
			path: '/newspack/v1/oauth/mailchimp',
		} )
			.then( res => {
				if ( error ) {
					setDataPropError( { slug: 'settings-connections', prop: 'mailchimp', value: '' } );
				}
				setAuthState( res );
			} )
			.catch( handleError );
	}, [] );

	useEffect( () => {
		if ( isModalOpen && modalTextRef.current ) {
			const inputElement = modalTextRef.current.querySelector( 'input' );
			if ( inputElement ) {
				inputElement.focus();
			}
		}
	}, [ isModalOpen ] );

	const submitAPIKey = () => {
		console.log( { submitAPIKey: apiKey } );
		wizardApiFetch< Promise< OAuthData > >( {
			path: '/newspack/v1/oauth/mailchimp',
			method: 'POST',
			isQuietFetch: true,
			isComponentFetch: true,
			data: {
				api_key: apiKey,
			},
		} )
			.then( res => {
				if ( error ) {
					setDataPropError( { slug: 'settings-connections', prop: 'mailchimp', value: '' } );
				}
				setAuthState( res );
			} )
			.catch( ( error: Error ) => {
				setError(
					error.message ||
						__(
							'Something went wrong during verification of your Mailchimp API key.',
							'newspack-plugin'
						)
				);
			} )
			.finally( () => {
				closeModal();
			} );
	};

	const disconnect = () => {
		console.log( { disconnect: apiKey } );
		wizardApiFetch< Promise< void > >( {
			path: '/newspack/v1/oauth/mailchimp',
			method: 'DELETE',
			isQuietFetch: true,
			isComponentFetch: true,
		} )
			.then( () => {
				setAuthState( {} );
				setDataPropError( {
					slug: 'settings-connections',
					prop: 'mailchimp',
					value: __( 'Invalid Mailchimp API Key.', 'newspack' ),
				} );
			} )
			.catch( handleError );
	};

	const getDescription = () => {
		if ( isLoading ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		if ( isConnected ) {
			// Translators: user connection status message.
			return sprintf( __( 'Connected as %s', 'newspack-plugin' ), authState.username );
		}
		return __( 'Not connected', 'newspack-plugin' );
	};

	const getModalButtonText = () => {
		if ( isLoading ) {
			return __( 'Connecting…', 'newspack-plugin' );
		}
		if ( isConnected ) {
			return __( 'Connected', 'newspack-plugin' );
		}
		return __( 'Connect', 'newspack-plugin' );
	};

	return (
		<>
			<ActionCard
				title="Mailchimp"
				description={ `${ __( 'Status:', 'newspack-plugin' ) } ${ getDescription() }` }
				checkbox={ isConnected ? 'checked' : 'unchecked' }
				actionText={
					<Button
						isLink
						isDestructive={ isConnected }
						onClick={ isConnected ? disconnect : openModal }
						disabled={ isLoading }
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
			{ isModalOpen && (
				<Modal
					title={ __( 'Add Mailchimp API Key', 'newspack-plugin' ) }
					onRequestClose={ closeModal }
					otherStuff={ '' }
				>
					<div ref={ modalTextRef }>
						<Grid columns={ 1 } gutter={ 8 }>
							<TextControl
								placeholder="123457103961b1f4dc0b2b2fd59c137b-us1"
								label={ __( 'Mailchimp API Key', 'newspack-plugin' ) }
								hideLabelFromVision={ true }
								value={ apiKey ?? '' }
								onChange={ ( value: string ) => setAPIKey( value ) }
								onKeyDown={ ( event: KeyboardEvent ) => {
									if ( ENTER === event.keyCode && '' !== apiKey ) {
										event.preventDefault();
										submitAPIKey();
									}
								} }
							/>
							<p>
								<ExternalLink href="https://mailchimp.com/help/about-api-keys/#Find_or_generate_your_API_key">
									{ __( 'Find or generate your API key', 'newspack-plugin' ) }
								</ExternalLink>
							</p>
						</Grid>
					</div>
					<Card buttonsCard noBorder className="justify-end">
						<Button isSecondary onClick={ closeModal }>
							{ __( 'Cancel', 'newspack-plugin' ) }
						</Button>
						<Button isPrimary disabled={ ! apiKey } onClick={ submitAPIKey }>
							{ getModalButtonText() }
						</Button>
					</Card>
				</Modal>
			) }
		</>
	);
};

export default Mailchimp;
