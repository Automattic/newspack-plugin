/**
 * SalesForce Settings Screen
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Notice, TextControl, withWizardScreen } from '../../../../components/src';

/**
 * SalesForce Settings Screen Component
 */
class SalesForce extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, isConnected, onChange } = this.props;
		const {
			client_id,
			client_secret,
			access_token,
			refresh_token
		} = data;

		return (
			<div className="newspack-salesforce-wizard">
				<Fragment>
					<h2>{ __( 'Connected App settings' ) }</h2>

					{
						! isConnected && ( client_id || client_secret ) && (
							<Notice noticeText={ __( 'Your site is not connected to SalesForce. Verify your Consumer Key and Secret, then click “Connect” to complete setup.' ) } isWarning />
						)
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
