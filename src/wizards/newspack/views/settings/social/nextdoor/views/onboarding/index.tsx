/**
 * Nextdoor Onboarding View
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Card, Grid, Notice, SelectControl, TextControl } from '../../../../../../../../components/src';
import { OnboardingViewProps } from '../../types';

export const OnboardingView = ( {
	settings,
	status,
	error,
	updateSettings,
	startOAuthFlow,
	claimPage,
	disconnect,
	setError,
}: OnboardingViewProps ) => {
	const [ clientId, setClientId ] = useState( settings.client_id || '' );
	const [ clientSecret, setClientSecret ] = useState( settings.client_secret || '' );
	const [ email, setEmail ] = useState( '' );
	const [ country, setCountry ] = useState( 'US' );
	const [ publicationUrl, setPublicationUrl ] = useState( settings.publication_url || '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ currentStep, setCurrentStep ] = useState( 1 );

	const countryOptions = window.newspackSettings?.social?.nextdoor?.country_options || [];

	useEffect( () => {
		// Check URL params for OAuth success
		const urlParams = new URLSearchParams( window.location.search );
		if ( urlParams.get( 'oauth_success' ) === '1' ) {
			setCurrentStep( 3 );
			setError( null );
		}
	}, [] );

	useEffect( () => {
		// Determine current step based on status
		if ( status.is_connected ) {
			setCurrentStep( 4 );
		} else if ( status.has_tokens ) {
			setCurrentStep( 3 );
		} else if ( status.has_credentials ) {
			setCurrentStep( 2 );
		} else {
			setCurrentStep( 1 );
		}
	}, [ status ] );

	const handleSaveCredentials = async () => {
		if ( ! clientId || ! clientSecret ) {
			setError( __( 'Please enter both Client ID and Client Secret.', 'newspack-plugin' ) );
			return;
		}

		try {
			setIsSaving( true );
			setError( null );
			await updateSettings( {
				client_id: clientId,
				client_secret: clientSecret,
			} );
			setCurrentStep( 2 );
		} catch ( saveError ) {
			// Error is handled by updateSettings
		} finally {
			setIsSaving( false );
		}
	};

	const handleStartOAuth = async () => {
		if ( ! email ) {
			setError( __( 'Please enter your email address.', 'newspack-plugin' ) );
			return;
		}

		try {
			setIsSaving( true );
			setError( null );
			const response = await startOAuthFlow( email, country );

			// Redirect to OAuth URL
			window.location.href = response.auth_url ?? window.location.href;
		} catch ( oauthError ) {
			// Error is handled by startOAuthFlow
		} finally {
			setIsSaving( false );
		}
	};

	const handleClaimPage = async () => {
		if ( ! publicationUrl ) {
			setError( __( 'Please enter your publication URL.', 'newspack-plugin' ) );
			return;
		}

		try {
			setIsSaving( true );
			setError( null );
			await claimPage( publicationUrl );
			setCurrentStep( 4 );
		} catch ( claimError ) {
			// Error is handled by claimPage
		} finally {
			setIsSaving( false );
		}
	};

	const handleDisconnect = async () => {
		try {
			setIsSaving( true );
			setError( null );
			await disconnect();
			setCurrentStep( 1 );
		} catch ( disconnectError ) {
			// Error is handled by disconnect
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<>
			{ error && <Notice noticeText={ error } isError onClose={ () => setError( null ) } /> }

			{ /* Step 1: API Credentials */ }
			{ currentStep === 1 && (
				<Card headerText={ __( 'Step 1: API Credentials', 'newspack-plugin' ) }>
					<p>{ __( 'To get started, you need to register your site with Nextdoor and obtain API credentials.', 'newspack-plugin' ) }</p>
					<p>
						<ExternalLink href="https://developer.nextdoor.com/">
							{ __( 'Get your API credentials from Nextdoor Developer Portal', 'newspack-plugin' ) }
						</ExternalLink>
					</p>

					<Grid columns={ 1 } gutter={ 16 }>
						<TextControl
							label={ __( 'Client ID', 'newspack-plugin' ) }
							value={ clientId }
							onChange={ setClientId }
							placeholder={ __( 'Enter your Nextdoor Client ID', 'newspack-plugin' ) }
						/>
						<TextControl
							label={ __( 'Client Secret', 'newspack-plugin' ) }
							value={ clientSecret }
							onChange={ setClientSecret }
							type="password"
							placeholder={ __( 'Enter your Nextdoor Client Secret', 'newspack-plugin' ) }
						/>
					</Grid>

					<div className="newspack-buttons-card">
						<Button isPrimary onClick={ handleSaveCredentials } disabled={ ! clientId || ! clientSecret || isSaving } isBusy={ isSaving }>
							{ __( 'Save & Continue', 'newspack-plugin' ) }
						</Button>
					</div>
				</Card>
			) }

			{ /* Step 2: Account Authentication */ }
			{ currentStep === 2 && (
				<Card headerText={ __( 'Step 2: Connect Your Account', 'newspack-plugin' ) }>
					<p>{ __( 'Connect your Nextdoor account to authorize publishing articles.', 'newspack-plugin' ) }</p>

					<Grid columns={ 1 } gutter={ 16 }>
						<TextControl
							label={ __( 'Email Address', 'newspack-plugin' ) }
							value={ email }
							onChange={ setEmail }
							type="email"
							placeholder={ __( 'Enter your Nextdoor account email', 'newspack-plugin' ) }
							help={ __( 'This should be the email address associated with your Nextdoor account.', 'newspack-plugin' ) }
						/>
						<SelectControl
							label={ __( 'Country', 'newspack-plugin' ) }
							value={ country }
							onChange={ setCountry }
							options={ countryOptions }
						/>
					</Grid>

					<div className="newspack-buttons-card">
						<Button isPrimary onClick={ handleStartOAuth } disabled={ ! email || isSaving } isBusy={ isSaving }>
							{ __( 'Connect Account', 'newspack-plugin' ) }
						</Button>
						<Button isSecondary onClick={ () => setCurrentStep( 1 ) }>
							{ __( 'Back', 'newspack-plugin' ) }
						</Button>
					</div>
				</Card>
			) }

			{ /* Step 3: Claim Page */ }
			{ currentStep === 3 && (
				<Card headerText={ __( 'Step 3: Claim Your News Page', 'newspack-plugin' ) }>
					<p>{ __( 'Claim your news page on Nextdoor to start publishing articles.', 'newspack-plugin' ) }</p>

					<Grid columns={ 1 } gutter={ 16 }>
						<TextControl
							label={ __( 'Publication URL', 'newspack-plugin' ) }
							value={ publicationUrl }
							onChange={ setPublicationUrl }
							type="url"
							placeholder={ __( 'https://yoursite.com', 'newspack-plugin' ) }
							help={ __( 'The main URL of your news publication.', 'newspack-plugin' ) }
						/>
					</Grid>

					<div className="newspack-buttons-card">
						<Button isPrimary onClick={ handleClaimPage } disabled={ ! publicationUrl || isSaving } isBusy={ isSaving }>
							{ __( 'Claim Page', 'newspack-plugin' ) }
						</Button>
						<Button isSecondary onClick={ () => setCurrentStep( 2 ) }>
							{ __( 'Back', 'newspack-plugin' ) }
						</Button>
					</div>
				</Card>
			) }

			{ /* Step 4: Success */ }
			{ currentStep === 4 && status.is_connected && (
				<ActionCard
					title={ __( 'Nextdoor Connected Successfully!', 'newspack-plugin' ) }
					description={ __(
						'Your site is now connected to Nextdoor. You can start publishing articles to your local community.',
						'newspack-plugin'
					) }
					actionText={ __( 'Configure Settings', 'newspack-plugin' ) }
					handoff={ 'settings' }
					editLink="#/settings"
					hasGreyHeader={ false }
				/>
			) }

			{ /* Connection Status */ }
			{ currentStep > 1 && (
				<Card headerText={ __( 'Connection Status', 'newspack-plugin' ) }>
					<Grid columns={ 2 } gutter={ 16 }>
						<div>
							<strong>{ __( 'API Credentials:', 'newspack-plugin' ) }</strong>
							<br />
							{ status.has_credentials ? (
								<span style={ { color: '#00a32a' } }>{ __( 'Configured', 'newspack-plugin' ) }</span>
							) : (
								<span style={ { color: '#d63638' } }>{ __( 'Not configured', 'newspack-plugin' ) }</span>
							) }
						</div>
						<div>
							<strong>{ __( 'Account Connected:', 'newspack-plugin' ) }</strong>
							<br />
							{ status.has_tokens ? (
								<span style={ { color: '#00a32a' } }>{ __( 'Yes', 'newspack-plugin' ) }</span>
							) : (
								<span style={ { color: '#d63638' } }>{ __( 'No', 'newspack-plugin' ) }</span>
							) }
						</div>
						<div>
							<strong>{ __( 'Page Claimed:', 'newspack-plugin' ) }</strong>
							<br />
							{ status.has_page ? (
								<span style={ { color: '#00a32a' } }>{ __( 'Yes', 'newspack-plugin' ) }</span>
							) : (
								<span style={ { color: '#d63638' } }>{ __( 'No', 'newspack-plugin' ) }</span>
							) }
						</div>
						<div>
							<strong>{ __( 'Overall Status:', 'newspack-plugin' ) }</strong>
							<br />
							{ status.is_connected ? (
								<span style={ { color: '#00a32a' } }>{ __( 'Connected', 'newspack-plugin' ) }</span>
							) : (
								<span style={ { color: '#d63638' } }>{ __( 'Not connected', 'newspack-plugin' ) }</span>
							) }
						</div>
					</Grid>

					{ status.is_connected && (
						<div className="newspack-buttons-card">
							<Button isDestructive onClick={ handleDisconnect } disabled={ isSaving } isBusy={ isSaving }>
								{ __( 'Disconnect', 'newspack-plugin' ) }
							</Button>
						</div>
					) }
				</Card>
			) }
		</>
	);
};

export default OnboardingView;
