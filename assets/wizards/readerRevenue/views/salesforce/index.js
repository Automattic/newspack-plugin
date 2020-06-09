/**
 * Salesforce Settings Screen
 */

/**
 * External dependencies
 */
import { parse } from 'qs';

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import './style.scss';
import { Notice, TextControl, Waiting, withWizardScreen } from '../../../../components/src';

/**
 * Salesforce Settings Screen Component
 */
class Salesforce extends Component {
	/**
	 * Constructor.
	 */
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			fetching: false
		};
	}

	/**
	 * Use auth code to request access and refresh tokens for Salesforce API.
	 * Saves tokens to options table.
	 * https://help.salesforce.com/articleView?id=remoteaccess_oauth_web_server_flow.htm&type=5
	 * @param {string} authorizationCode Auth code fetched from Salesforce.
	 * @return {void}
	 */
	async getTokens( authorizationCode ) {
		const { data, onChange, redirectURI, wizardApiFetch } = this.props;

		// Init fetching state.
		this.setState( { fetching: true } );

		try {
			// Get the tokens.
			const response = await wizardApiFetch( {
				path: '/newspack/v1/wizard/salesforce/tokens',
				method: 'POST',
				data: {
					code: authorizationCode,
					redirect_uri: redirectURI
				}
			} );

			// Update values in parent state.
			if ( response.access_token && response.refresh_token ) {
				onChange( response );
			} else {
				throw new Error( 'Could not retrieve access tokens. Please try connecting again.' );
			}
		} catch( e ) {
			this.setState( { error: e } );
		}

		// End fetching state.
		this.setState( { fetching: false } );
	}

	async testWebhookHandler() {
		const response = await apiFetch( {
			path: '/newspack/v1/salesforce/sync',
			method: 'POST',
			data: {
				Email: 'newlead@hotmail.com',
				FirstName: 'Hatchet',
				LastName: 'Sullivan'
			}
		} );

		console.log( response );
	}

	/**
	 * Render.
	 */
	render() {
		const { data, isConnected, onChange } = this.props;
		const { error, fetching } = this.state;
		const {
			client_id,
			client_secret
		} = data;

		console.log( data );

		this.testWebhookHandler();

		const query = parse( window.location.search );
		const authorizationCode = query.code;

		if ( authorizationCode ) {
			// Remove param from URL so we don't get stuck in a re-render loop.
			window.history.replaceState( {}, '', window.location.origin + window.location.pathname + '?page=' + query['?page'] + window.location.hash );

			this.getTokens( authorizationCode );
		}

		return (
			<div className="newspack-salesforce-wizard">
				<Fragment>
					<h2>{ __( 'Connected App settings' ) }</h2>

					{
						fetching && (
							<div className="newspack_salesforce_loading">
								<Waiting isLeft />
								{ __( 'Connecting...', 'newspack' ) }
							</div>
						)
					}

					{
						error && <Notice noticeText={ __( error ) } isWarning />
					}

					{
						isConnected ?
						<Notice noticeText={ __( 'Your site is connected to Salesforce.' ) } isSuccess />
						:
						<Fragment>
							<p>
								{ __( 'To connect with Salesforce, create or choose a Connected App for this site in your Salesforce dashboard. Make sure to add the the URL for this page as a Redirect URI in the Connected App’s settings. ' ) }
								<ExternalLink href="https://help.salesforce.com/articleView?id=connected_app_create.htm">
									{ __( 'Learn how to create a Connected App' ) }
								</ExternalLink>
							</p>

							<p>{ __( 'Once you’ve created or located a Connected App for this site, you’ll find the Consumer Key and Secret under the “API (Enable OAuth Settings)” section in Salesforce.' ) }</p>

							<p>{ __( 'Enter your Consumer Key and Secret below, then click “Connect” to authorize access to your Salesforce account.' ) }</p>
						</Fragment>
					}

					{ isConnected && (
						<p>{ __( 'To reconnect your site in case of issues, or to connect to a different Salesforce account, click “Reset" below. You will need to re-enter your Consumer Key and Secret before you can re-connect to Salesforce.' ) }</p>
					) }

					<TextControl
						label={ ( isConnected ? __( 'Your' ) : __( 'Enter your' ) ) + __( ' Salesforce Consumer Key' ) }
						value={ client_id }
						disabled={ isConnected }
						onChange={ value => {
							onChange( { ...data, client_id: value } );
						} }
					/>
					<TextControl
						label={ __( ( isConnected ? __( 'Your' ) : __( 'Enter your' ) ) +' Salesforce Consumer Secret' ) }
						value={ client_secret }
						disabled={ isConnected }
						onChange={ value =>
							onChange( { ...data, client_secret: value } )
						}
					/>
				</Fragment>
			</div>
		);
	}
}

Salesforce.defaultProps = {
	data: {},
	onChange: () => null,
};

export default withWizardScreen( Salesforce );
