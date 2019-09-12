/**
 * Collects and connects with Mailchimp API key.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Card, TextControl, PluginInstaller, withWizardScreen } from '../../../../components/src';

/**
 * Initial connection to Mailchimp.
 */
class Newsletters extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			pluginRequirementsMet: false,
		};
	}
	/**
	 * Render.
	 */
	render() {
		const { apiKey, connected, connectURL, onChange } = this.props;
		const { pluginRequirementsMet } = this.state;
		return ! pluginRequirementsMet ? (
			<PluginInstaller
				plugins={ [ 'mailchimp-for-woocommerce' ] }
				onStatus={ ( { complete } ) => this.setState( { pluginRequirementsMet: complete } ) }
			/>
		) : (
			<div className="newspack-engagement-wizard__mailchimp-connect-screen">
				<Card className="newspack-newsletter-block-wizard__jetpack-info">
					{ ! connected && (
						<p>
							{ __(
								'This feature connects your site to Mailchimp and sets up a Mailchimp block you can use to get new subscribers for your newsletter. The Mailchimp connection to your site for this feature is managed through Jetpack and WordPress.com.'
							) }
						</p>
					) }
					{ !! connected && (
						<p className="newspack-newsletter-block-wizard__jetpack-success">
							<Dashicon icon="yes-alt" />
							{ __(
								'You can insert newsletter sign up forms in your content using the Mailchimp block.'
							) }
						</p>
					) }
					<p className="wpcom-link">
						<ExternalLink href={ connectURL }>
							{ ! connected
								? __( 'Set up Mailchimp on WordPress.com' )
								: __( 'Manage your Mailchimp connection' ) }
						</ExternalLink>
					</p>
					<TextControl
						label={ __( 'Enter your Mailchimp API key' ) }
						value={ apiKey }
						onChange={ value => onChange( value ) }
					/>
					<p><em>
						{ __(
							'To find your Mailchimp API key, log into your Mailchimp account and go to Account settings > Extras > API keys. From there, either grab an existing key or generate a new one.'
						) }
					</em></p>
				</Card>
			</div>
		);
	}
}

export default withWizardScreen( Newsletters );
