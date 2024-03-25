/**
 * WordPress dependencies.
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { ENTER } from '@wordpress/keycodes';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, Card, Grid, Modal, TextControl } from '../../../../components/src';

const Mailchimp = ( { setError } ) => {
	const [ authState, setAuthState ] = useState( {} );
	const [ isModalOpen, setisModalOpen ] = useState( false );
	const [ apiKey, setAPIKey ] = useState();
	const [ isLoading, setIsLoading ] = useState( false );

	const modalTextRef = useRef( null );
	const isConnected = Boolean( authState && authState.username );

	const handleError = res =>
		setError( res.message || __( 'Something went wrong.', 'newspack-plugin' ) );

	const openModal = () => setisModalOpen( true );
	const closeModal = () => {
		setisModalOpen( false );
		setAPIKey();
	};

	// Check the Mailchimp connectivity status.
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
						__(
							'Something went wrong during verification of your Mailchimp API key.',
							'newspack-plugin'
						)
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
				isMedium
			/>
			{ isModalOpen && (
				<Modal
					title={ __( 'Add Mailchimp API Key', 'newspack-plugin' ) }
					onRequestClose={ closeModal }
				>
					<div ref={ modalTextRef }>
						<Grid columns={ 1 } gutter={ 8 }>
							<TextControl
								placeholder="123457103961b1f4dc0b2b2fd59c137b-us1"
								label={ __( 'Mailchimp API Key', 'newspack-plugin' ) }
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
