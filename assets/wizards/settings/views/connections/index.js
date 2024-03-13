/**
 * Settings
 */

/**
 * Dependencies.
 */
// WordPress
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

// Internal
import Plugins from '../../../connections/views/main/plugins';
import GoogleAuth from '../../../connections/views/main/google';
import Mailchimp from '../../../connections/views/main/mailchimp';
import FivetranConnection from '../../../connections/views/main/fivetran';
import Recaptcha from '../../../connections/views/main/recaptcha';
import Webhooks from '../../../connections/views/main/webhooks';
import { Card, Notice, SectionHeader } from '../../../../components/src';

const { newspack_settings_data: newspackSettingsData } = window;

const Connections = () => {
	const [ error, setError ] = useState();
	const setErrorWithPrefix = prefix => err => setError( err ? prefix + err : null );

	return (
		<Card noBorder className="newspack-design">
			{ error && <Notice isError noticeText={ error } /> }
			<SectionHeader title={ __( 'Plugins', 'newspack-plugin' ) } />
			<Plugins />
			<SectionHeader title={ __( 'APIs', 'newspack-plugin' ) } />
			{ newspackSettingsData.can_connect_google && (
				<GoogleAuth setError={ setErrorWithPrefix( __( 'Google: ', 'newspack-plugin' ) ) } />
			) }
			<Mailchimp setError={ setErrorWithPrefix( __( 'Mailchimp: ', 'newspack-plugin' ) ) } />
			{ newspackSettingsData.can_connect_fivetran && (
				<>
					<SectionHeader title="Fivetran" />
					<FivetranConnection
						setError={ setErrorWithPrefix( __( 'Fivetran: ', 'newspack-plugin' ) ) }
					/>
				</>
			) }
			<Recaptcha setError={ setErrorWithPrefix( __( 'reCAPTCHA: ', 'newspack-plugin' ) ) } />
			{ newspackSettingsData.can_use_webhooks && <Webhooks /> }
		</Card>
	);
};

export default Connections;
