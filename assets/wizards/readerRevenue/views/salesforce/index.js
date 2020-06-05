/**
 * SalesForce Settings Screen
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
import { Notice, TextControl, Waiting, withWizardScreen } from '../../../../components/src';

/**
 * SalesForce Settings Screen Component
 */
class SalesForce extends Component {
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
	 * Use auth code to request access and refresh tokens for SalesForce API.
	 * Saves tokens to options table.
	 * https://help.salesforce.com/articleView?id=remoteaccess_oauth_web_server_flow.htm&type=5
	 * @param {string} authorizationCode Auth code fetched from SalesForce.
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
						<Notice noticeText={ __( 'Your site is connected to SalesForce.' ) } isSuccess />
						:
						<Fragment>
							<p>
								{ __( 'To connect with SalesForce, create or choose a Connected App for this site in your SalesForce dashboard. ' ) }
								<ExternalLink href="https://help.salesforce.com/articleView?id=connected_app_create.htm">
									{ __( 'Learn how to create a Connected App' ) }
								</ExternalLink>
							</p>

							<p>{ __( 'Once you’ve created or located a Connected App for this site, you’ll find the Consumer Key and Secret under the “API (Enable OAuth Settings)” section in SalesForce.' ) }</p>

							<p>{ __( 'Enter your Consumer Key and Secret below, then click “Connect” to authorize access to your SalesForce account.' ) }</p>
						</Fragment>
					}

					<TextControl
						label={ ( isConnected ? __( 'Your' ) : __( 'Enter your' ) ) + __( ' SalesForce Consumer Key' ) }
						value={ client_id }
						disabled={ isConnected }
						onChange={ value => {
							onChange( { ...data, client_id: value } );
						} }
					/>
					<TextControl
						label={ __( ( isConnected ? __( 'Your' ) : __( 'Enter your' ) ) +' SalesForce Consumer Secret' ) }
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

SalesForce.defaultProps = {
	data: {},
	onChange: () => null,
};

export default withWizardScreen( SalesForce );
