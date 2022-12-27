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
			{ newspack_connections_data.can_connect_google && <GoogleAuth setError={ setError } /> }
			<Mailchimp setError={ setError } />
			{ newspack_connections_data.can_connect_fivetran && (
				<>
					<SectionHeader title="Fivetran" />
					<FivetranConnection setError={ setError } />
				</>
			) }
			<Recaptcha setError={ setError } />
			<Webhooks />
		</>
	);
};

export default Main;
