/**
 * External dependencies
 */
import { parse } from 'qs';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies.
 */
import { Card, Grid, Notice, TextControl, Wizard, Button } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

const Salesforce = () => {
	const { salesforce_settings: salesforceData = {} } = Wizard.useWizardData( {} );
	const [ error, setError ] = useState( null );

	const isConnected = !! salesforceData.refresh_token;

	const { updateWizardSettings, saveWizardSettings, wizardApiFetch } = useDispatch(
		Wizard.STORE_NAMESPACE
	);
	const saveSettings = value =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'salesforce',
			payloadPath: [ 'salesforce_settings' ],
			updatePayload: {
				path: [ 'salesforce_settings' ],
				value,
			},
		} );

	/**
	 * Use auth code to request access and refresh tokens for Salesforce API.
	 * Saves tokens to options table.
	 * https://help.salesforce.com/articleView?id=remoteaccess_oauth_web_server_flow.htm&type=5
	 *
	 * @param {string} authorizationCode Auth code fetched from Salesforce.
	 * @return {void}
	 */
	const getTokens = async ( authorizationCode, redirectURI ) => {
		try {
			// Get the tokens.
			const response = await wizardApiFetch( {
				path: '/newspack/v1/wizard/salesforce/tokens',
				method: 'POST',
				data: {
					code: authorizationCode,
					redirect_uri: redirectURI,
				},
			} );

			const { access_token, client_id, client_secret, instance_url, refresh_token } = response;

			if ( access_token && refresh_token ) {
				saveSettings( {
					access_token,
					client_id,
					client_secret,
					instance_url,
					refresh_token,
				} );
			}
		} catch ( e ) {
			setError(
				__(
					'We couldn’t establish a connection to Salesforce. Please verify your Consumer Key and Secret and try connecting again.',
					'newspack'
				)
			);
		}
	};

	/**
	 * Check validity of refresh token and show an error message if it's no longer active.
	 * The refresh token is valid until it's manually revoked in the Salesforce dashboard,
	 * or the Connected App is deleted there.
	 */
	const checkConnectionStatus = async () => {
		const response = await wizardApiFetch( {
			path: '/newspack/v1/wizard/salesforce/connection-status',
			method: 'POST',
			isQuietFetch: true,
		} );
		if ( response.error ) {
			setError( response.error );
		}
	};

	useEffect( () => {
		const query = parse( window.location.search );
		const authorizationCode = query.code;
		if ( authorizationCode ) {
			const redirectURI =
				window.location.origin +
				window.location.pathname +
				'?page=' +
				query[ '?page' ] +
				window.location.hash;

			// Remove `code` param from URL without adding history.
			window.history.replaceState( {}, '', redirectURI );
			getTokens( authorizationCode, redirectURI );
		}
	}, [] );

	useEffect( () => {
		if ( isConnected ) {
			checkConnectionStatus();
		} else {
			setError( null );
		}
	}, [ isConnected ] );

	const onButtonClick = async () => {
		// If Salesforce is already connected, button should reset settings.
		if ( isConnected ) {
			saveSettings( {
				client_id: '',
				client_secret: '',
				access_token: '',
				refresh_token: '',
				instance_url: '',
			} );
			return;
		}

		// Otherwise, attempt to establish a connection with Salesforce.
		const { client_id, client_secret } = salesforceData;

		if ( client_id && client_secret ) {
			const loginUrl = addQueryArgs( 'https://login.salesforce.com/services/oauth2/authorize', {
				response_type: 'code',
				client_id: encodeURIComponent( client_id ),
				client_secret: encodeURIComponent( client_secret ),
				redirect_uri: encodeURI( window.location.href ),
			} );

			saveSettings( {
				client_id,
				client_secret,
			} );

			// Validate credentials before redirecting.
			const valid = await wizardApiFetch( {
				path: '/newspack/v1/wizard/salesforce/validate',
				method: 'POST',
				data: {
					client_id,
					client_secret,
					redirect_uri: window.location.href,
				},
				isQuietFetch: true,
			} );

			if ( valid ) {
				return window.location.assign( loginUrl );
			}
			setError( __( 'The credentials are invalid.', 'newspack' ) );
		}
	};

	const changeHandler = key => value =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'salesforce_settings', key ],
			value,
		} );

	return (
		<>
			<Grid>
				<Card noBorder>
					{ error && <Notice noticeText={ error } isWarning /> }

					{ isConnected && ! error && (
						<Notice
							noticeText={ __( 'Your site is connected to Salesforce.', 'newspack' ) }
							isSuccess
						/>
					) }

					{ ! isConnected && ! error && (
						<>
							<p>
								{ __(
									'To connect with Salesforce, create or choose a Connected App for this site in your Salesforce dashboard. Make sure to paste the the full URL for this page into the “Callback URL” field in the Connected App’s settings. ',
									'newspack'
								) }
								<ExternalLink href="https://help.salesforce.com/articleView?id=connected_app_create.htm">
									{ __( 'Learn how to create a Connected App', 'newspack' ) }
								</ExternalLink>
							</p>

							<p>
								{ __(
									'Enter your Consumer Key and Secret, then click “Connect” to authorize access to your Salesforce account.',
									'newspack'
								) }
							</p>
						</>
					) }

					{ isConnected && (
						<p>
							{ __(
								'To reconnect your site in case of issues, or to connect to a different Salesforce account, click “Reset". You will need to re-enter your Consumer Key and Secret before you can re-connect to Salesforce.',
								'newspack'
							) }
						</p>
					) }
				</Card>

				<Card noBorder>
					{ error && (
						<Notice
							noticeText={ __(
								'We couldn’t connect to Salesforce. Please verify that you entered the correct Consumer Key and Secret and try again. If you just created your Connected App or edited the Callback URL settings, it may take up to an hour before we can establish a connection.',
								'newspack'
							) }
							isError
						/>
					) }
					<TextControl
						disabled={ isConnected }
						label={
							( isConnected ? __( 'Your', 'newspack' ) : __( 'Enter your', 'newspack' ) ) +
							__( ' Salesforce Consumer Key', 'newspack' )
						}
						value={ salesforceData.client_id }
						onChange={ changeHandler( 'client_id' ) }
					/>
					<TextControl
						disabled={ isConnected }
						label={
							( isConnected ? __( 'Your', 'newspack' ) : __( 'Enter your', 'newspack' ) ) +
							__( ' Salesforce Consumer Secret', 'newspack' )
						}
						value={ salesforceData.client_secret }
						onChange={ changeHandler( 'client_secret' ) }
					/>
				</Card>
			</Grid>
			<div className="newspack-buttons-card">
				<Button
					isPrimary
					disabled={ ! salesforceData.client_id || ! salesforceData.client_secret }
					onClick={ onButtonClick }
				>
					{ isConnected ? __( 'Reset', 'newspack' ) : __( 'Connect', 'newspack' ) }
				</Button>
			</div>
		</>
	);
};

export default Salesforce;
