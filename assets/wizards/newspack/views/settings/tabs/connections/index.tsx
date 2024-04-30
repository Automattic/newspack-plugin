import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

import { SectionHeader, Notice } from '@components';
import GoogleOAuth from './google';
import Plugins from './plugins';
import Mailchimp from './mailchimp';
import FivetranConnection from './fivetran';
import Recaptcha from './recaptcha';
import Webhooks from './webhooks';

const { connections } = window.newspackSettings.sections;

const Connections = () => {
	const [ error, setError ] = useState< string | null >();
	const setErrorWithPrefix = ( prefix: string ) => ( err: ErrorStateParams ) =>
		setError( err ? prefix + err : null );

	return (
		<div className="newspack-dashboard__section">
			{ error && <Notice isError noticeText={ error } /> }
			<SectionHeader heading={ 3 } title={ __( 'Plugins', 'newspack-plugin' ) } />
			<Plugins />
		</div>
	);
};

export default Connections;
