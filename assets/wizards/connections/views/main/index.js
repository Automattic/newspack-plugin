/* global newspack_connections_data */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Notice, SectionHeader } from '../../../../components/src';
import Plugins from './plugins';
import GoogleAuth from './google';
import Mailchimp from './mailchimp';
import FivetranConnection from './fivetran';
import Recaptcha from './recaptcha';
import Webhooks from './webhooks';

const Main = () => {
	const [ error, setError ] = useState();
	const setErrorWithPrefix = prefix => err => setError( err ? prefix + err : null );

	return (
		<>
			{ error && <Notice isError noticeText={ error } /> }
			<SectionHeader title={ __( 'Plugins', 'newspack' ) } />
			<Plugins />
			<SectionHeader title={ __( 'APIs', 'newspack' ) } />
			{ newspack_connections_data.can_connect_google && (
				<GoogleAuth setError={ setErrorWithPrefix( __( 'Google: ', 'newspack-plugin' ) ) } />
			) }
			<Mailchimp setError={ setErrorWithPrefix( __( 'Mailchimp: ', 'newspack-plugin' ) ) } />
			{ newspack_connections_data.can_connect_fivetran && (
				<>
					<SectionHeader title="Fivetran" />
					<FivetranConnection
						setError={ setErrorWithPrefix( __( 'Fivetran: ', 'newspack-plugin' ) ) }
					/>
				</>
			) }
			<Recaptcha setError={ setErrorWithPrefix( __( 'reCAPTCHA: ', 'newspack-plugin' ) ) } />
			{ newspack_connections_data.can_use_webhooks && <Webhooks /> }
		</>
	);
};

export default Main;
