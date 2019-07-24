/**
 * Collects and connects with Mailchimp API key.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	TextControl,
	withWizardScreen,
} from '../../../components/src';

/**
 * Initial connection to Mailchimp.
 */
class MailchimpConnectScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const { apiKey, onChange } = this.props;
		return (
			<Fragment>
				<TextControl
					label={ __( 'Enter your Mailchimp API key' ) }
					value={ apiKey }
					onChange={ value => onChange( value ) }
				/>
				<p>
					{ __( 'To find your Mailchimp API key, log into your Mailchimp account and go to Account settings > Extras > API keys. From there, either grab an existing key or generate a new one.' ) }
				</p>
			</Fragment>
		);
	}
}

export default withWizardScreen( MailchimpConnectScreen );
