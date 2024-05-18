/**
 * Settings Wizard: Connections > Mailchimp
 */

/**
 * WordPress dependencies.
 */
import { ENTER } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import WizardsActionCard from '../../../../wizards-action-card';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import useWizardError from '../../../../hooks/use-wizard-error';
import { Button, Card, Grid, Modal, TextControl } from '../../../../../components/src';

const Mailchimp = () => {
	const [ authState, setAuthState ] = useState< OAuthData >( {} );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ apiKey, setAPIKey ] = useState< string | undefined >();

	const { wizardApiFetch, isFetching } = useWizardApiFetch();

	const { error, setError, resetError } = useWizardError(
		'newspack/settings',
		'connections/apis/mailchimp'
	);

	const modalTextRef = useRef< HTMLDivElement >( null );
	const isConnected = Boolean( authState && authState.username );

	const openModal = () => setIsModalOpen( true );
	const closeModal = () => {
		setIsModalOpen( false );
		setAPIKey( undefined );
	};

	useEffect( () => {
		const fetchData = () =>
			wizardApiFetch< OAuthData >(
				{
					path: '/newspack/v1/oauth/mailchimp',
				},
				{
					onSuccess( fetchedData ) {
						resetError();
						setAuthState( fetchedData );
					},
					onError( e ) {
						setError( e );
					},
				}
			);
		fetchData();
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
		wizardApiFetch< OAuthData >(
			{
				path: '/newspack/v1/oauth/mailchimp',
				method: 'POST',
				data: {
					api_key: apiKey,
				},
			},
			{
				onSuccess( fetchedData ) {
					resetError();
					setAuthState( fetchedData );
				},
				onError( e ) {
					setError(
						e,
						__(
							'Something went wrong during verification of your Mailchimp API key.',
							'newspack-plugin'
						)
					);
				},
				onFinally() {
					closeModal();
				},
			}
		);
	};

	const disconnect = () => {
		wizardApiFetch< OAuthData >(
			{
				path: '/newspack/v1/oauth/mailchimp',
				method: 'DELETE',
			},
			{
				onSuccess() {
					setAuthState( {} );
					setError( __( 'Invalid Mailchimp API Key.', 'newspack-plugin' ) );
				},
				onError( e ) {
					setError( e );
				},
			}
		);
	};

	const getDescription = () => {
		if ( isFetching ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		if ( isConnected ) {
			// Translators: user connection status message.
			return sprintf( __( 'Connected as %s', 'newspack-plugin' ), authState.username );
		}
		return __( 'Not connected', 'newspack-plugin' );
	};

	const getModalButtonText = () => {
		if ( ! apiKey ) {
			return __( 'Invalid Mailchimp API Key.', 'newspack' );
		}
		if ( isFetching ) {
			return __( 'Connecting…', 'newspack-plugin' );
		}
		if ( isConnected ) {
			return __( 'Connected', 'newspack-plugin' );
		}
		return __( 'Connect', 'newspack-plugin' );
	};

	return (
		<>
			<WizardsActionCard
				title="Mailchimp"
				description={ getDescription() }
				isChecked={ isConnected }
				actionText={
					<Button
						isLink
						isDestructive={ isConnected }
						onClick={ isConnected ? disconnect : openModal }
						disabled={ isFetching }
					>
						{ isConnected
							? __( 'Disconnect', 'newspack-plugin' )
							: __( 'Connect', 'newspack-plugin' ) }
					</Button>
				}
				error={ error }
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
