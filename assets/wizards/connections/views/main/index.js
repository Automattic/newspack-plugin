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

	return (
		<>
			{ error && <Notice isError noticeText={ error } /> }
			<SectionHeader title={ __( 'Plugins', 'newspack' ) } />
			<Plugins />
			<SectionHeader title={ __( 'APIs', 'newspack' ) } />
			{ newspack_connections_data.can_connect_google && (
				<GoogleAuth setError={ err => setError( __( 'Google: ', 'newspack-plugin' ) + err ) } />
			) }
			<Mailchimp setError={ err => setError( __( 'Mailchimp: ', 'newspack-plugin' ) + err ) } />
			{ newspack_connections_data.can_connect_fivetran && (
				<>
					<SectionHeader title="Fivetran" />
					<FivetranConnection
						setError={ err => setError( __( 'FiveTran: ', 'newspack-plugin' ) + err ) }
					/>
				</>
			) }
			<Recaptcha setError={ err => setError( __( 'reCAPTCHA: ', 'newspack-plugin' ) + err ) } />
			<Webhooks />
		</>
	);
};

export default Main;
