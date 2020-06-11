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
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import './style.scss';
import { Notice, TextControl, withWizardScreen } from '../../../../components/src';

/**
 * Salesforce Settings Screen Component
 */
class Salesforce extends Component {
	/**
	 * On component mount.
	 */
	componentDidMount() {
		const query = parse( window.location.search );
		const authorizationCode = query.code;
		const redirectURI =
			window.location.origin +
			window.location.pathname +
			'?page=' +
			query[ '?page' ] +
			window.location.hash;

		if ( authorizationCode ) {
			// Remove `code` param from URL without adding history.
			window.history.replaceState( {}, '', redirectURI );

			this.getTokens( authorizationCode, redirectURI );
		}
	}

	/**
	 * Use auth code to request access and refresh tokens for Salesforce API.
	 * Saves tokens to options table.
	 * https://help.salesforce.com/articleView?id=remoteaccess_oauth_web_server_flow.htm&type=5
	 *
	 * @param {string} authorizationCode Auth code fetched from Salesforce.
	 * @return {void}
	 */
	async getTokens( authorizationCode, redirectURI ) {
		const { data, onChange, wizardApiFetch } = this.props;

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

			// Update values in parent state.
			if ( access_token && refresh_token ) {
				return onChange( {
					...data,
					access_token,
					client_id,
					client_secret,
					instance_url,
					refresh_token,
				} );
			}

			throw new Error( 'Could not retrieve access tokens. Please try connecting again.' );
		} catch ( e ) {
			console.error( e );
		}
	}

	/**
	 * Render.
	 */
	render() {
		const { data, isConnected, onChange } = this.props;
		const { client_id, client_secret } = data;

		return (
			<div className="newspack-salesforce-wizard">
				<Fragment>
					<h2>{ __( 'Connected App settings' ) }</h2>

					{ isConnected ? (
						<Notice noticeText={ __( 'Your site is connected to Salesforce.' ) } isSuccess />
					) : (
						<Fragment>
							<p>
								{ __(
									'To connect with Salesforce, create or choose a Connected App for this site in your Salesforce dashboard. Make sure to add the the URL for this page as a Redirect URI in the Connected App’s settings. '
								) }
								<ExternalLink href="https://help.salesforce.com/articleView?id=connected_app_create.htm">
									{ __( 'Learn how to create a Connected App' ) }
								</ExternalLink>
							</p>

							<p>
								{ __(
									'Once you’ve created or located a Connected App for this site, you’ll find the Consumer Key and Secret under the “API (Enable OAuth Settings)” section in Salesforce.'
								) }
							</p>

							<p>
								{ __(
									'Enter your Consumer Key and Secret below, then click “Connect” to authorize access to your Salesforce account.'
								) }
							</p>
						</Fragment>
					) }

					{ isConnected && (
						<p>
							{ __(
								'To reconnect your site in case of issues, or to connect to a different Salesforce account, click “Reset" below. You will need to re-enter your Consumer Key and Secret before you can re-connect to Salesforce.'
							) }
						</p>
					) }

					<TextControl
						label={
							( isConnected ? __( 'Your' ) : __( 'Enter your' ) ) + __( ' Salesforce Consumer Key' )
						}
						value={ client_id }
						onChange={ value => {
							if ( isConnected ) {
								return;
							}
							onChange( { ...data, client_id: value } );
						} }
					/>
					<TextControl
						label={ __(
							( isConnected ? __( 'Your' ) : __( 'Enter your' ) ) + ' Salesforce Consumer Secret'
						) }
						value={ client_secret }
						onChange={ value => {
							if ( isConnected ) {
								return;
							}
							onChange( { ...data, client_secret: value } );
						} }
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
