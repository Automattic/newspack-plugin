/**
 * WordPress dependencies.
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, Card, Modal, TextControl } from '../../../../components/src';

const MailChimp = ( { setError } ) => {
	const [ authState, setAuthState ] = useState( {} );
	const [ isModalOpen, setisModalOpen ] = useState( false );
	const [ apiKey, setAPIKey ] = useState();
	const [ isLoading, setIsLoading ] = useState( false );

	const modalTextRef = useRef( null );
	const isConnected = Boolean( authState && authState.username );

	const handleError = res => setError( res.message || __( 'Something went wrong.', 'newspack' ) );

	const openModal = () => setisModalOpen( true );
	const closeModal = () => {
		setisModalOpen( false );
		setAPIKey();
	};

	// check the MailChimp connectivity status.
	useEffect( () => {
		setIsLoading( true );
		apiFetch( { path: '/newspack/v1/oauth/mailchimp' } )
			.then( res => {
				setAuthState( res );
			} )
			.catch( handleError )
			.finally( () => setIsLoading( false ) );
	}, [] );

	useEffect( () => {
		if ( isModalOpen ) {
			modalTextRef.current.querySelector( 'input' ).focus();
		}
	}, [ isModalOpen ] );

	const submitAPIKey = () => {
		setError();
		setIsLoading( true );
		apiFetch( {
			path: '/newspack/v1/oauth/mailchimp',
			method: 'POST',
			data: {
				api_key: apiKey,
			},
		} )
			.then( res => {
				setAuthState( res );
			} )
			.catch( e => {
				setError(
					e.message ||
						__( 'Something went wrong during verification of your MailChimp API key.', 'newspack' )
				);
			} )
			.finally( () => {
				setIsLoading( false );
				closeModal();
			} );
	};

	const disconnect = () => {
		setIsLoading( true );
		apiFetch( {
			path: '/newspack/v1/oauth/mailchimp',
			method: 'DELETE',
		} )
			.then( () => {
				setAuthState( {} );
				setIsLoading( false );
			} )
			.catch( handleError );
	};

	const getDescription = () => {
		if ( isLoading ) {
			return __( 'Loading…', 'newspack' );
		}
		if ( isConnected ) {
			return sprintf( __( 'Connected as %s', 'newspack' ), authState.username );
		}
		return __( 'Not connected', 'newspack' );
	};

	const getModalButtonText = () => {
		if ( isLoading ) {
			return __( 'Connecting…', 'newspack' );
		}
		if ( isConnected ) {
			return __( 'Connected', 'newspack' );
		}
		return __( 'Connect', 'newspack' );
	};

	return (
		<>
			<ActionCard
				title={ __( 'MailChimp', 'newspack' ) }
				description={ getDescription() }
				checkbox={ isConnected ? 'checked' : 'unchecked' }
				actionText={
					<Button
						isLink
						isDestructive={ isConnected }
						onClick={ isConnected ? disconnect : openModal }
						disabled={ isLoading }
					>
						{ isConnected ? __( 'Disconnect', 'newspack' ) : __( 'Connect', 'newspack' ) }
					</Button>
				}
				isMedium
			/>
			{ isModalOpen && (
				<Modal title={ __( 'Add MailChimp API Key', 'newspack' ) } onRequestClose={ closeModal }>
					<div ref={ modalTextRef }>
						<TextControl
							placeholder={ __( 'MailChimp API Key', 'newspack' ) }
							label={ __( 'MailChimp API Key', 'newspack' ) }
							help={
								<span
									dangerouslySetInnerHTML={ {
										__html: sprintf(
											__(
												'You can get your API Key from your <a target="_blank" href="%s">API dashboard</a>',
												'newspack'
											),
											'https://us1.admin.mailchimp.com/account/api/'
										),
									} }
								/>
							}
							hideLabelFromVision={ true }
							value={ apiKey }
							onChange={ setAPIKey }
							onKeyDown={ event => {
								if ( ENTER === event.keyCode && '' !== apiKey ) {
									event.preventDefault();
									submitAPIKey();
								}
							} }
						/>
					</div>
					<Card buttonsCard noBorder className="justify-end">
						<Button
							isSecondary
							onClick={ () => {
								closeModal();
							} }
						>
							{ __( 'Cancel', 'newspack' ) }
						</Button>
						<Button isPrimary disabled={ ! apiKey } onClick={ () => submitAPIKey() }>
							{ getModalButtonText() }
						</Button>
					</Card>
				</Modal>
			) }
		</>
	);
};

export default MailChimp;
