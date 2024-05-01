import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

import { SectionHeader, Notice } from '../../../../../../components/src';
import GoogleOAuth from './google';
import Plugins from './plugins';
import Mailchimp from './mailchimp';
import FivetranConnection from './fivetran';
import Recaptcha from './recaptcha';
import Webhooks from './webhooks';
import Analytics from './analytics';
import CustomEvents from './custom-events';

const { connections } = window.newspackSettings.tabs;

const Connections = () => {
	const [ error, setError ] = useState< string | null >();
	const setErrorWithPrefix = ( prefix: string ) => ( err: ErrorStateParams ) =>
		setError( err ? prefix + err : null );

	return (
		<div className="newspack-dashboard__section">
			{ error && <Notice isError noticeText={ error } /> }
			<SectionHeader heading={ 3 } title={ __( 'Plugins', 'newspack-plugin' ) } />
			<Plugins />
			<SectionHeader heading={ 3 } title={ __( 'APIs', 'newspack-plugin' ) } />
			{ connections.dependencies.google && (
				<GoogleOAuth setError={ setErrorWithPrefix( __( 'Google: ', 'newspack-plugin' ) ) } />
			) }
			<Mailchimp setError={ setErrorWithPrefix( __( 'Mailchimp: ', 'newspack-plugin' ) ) } />
			{ connections.dependencies.fivetran && (
				<>
					<SectionHeader title="Fivetran" />
					<FivetranConnection
						setError={ setErrorWithPrefix( __( 'Fivetran: ', 'newspack-plugin' ) ) }
					/>
				</>
			) }
			<Recaptcha />
			{ connections.dependencies.webhooks && <Webhooks /> }
			<SectionHeader heading={ 3 } title={ __( 'Analytics', 'newspack-plugin' ) } />
			<Analytics editLink={ connections.sections.analytics.editLink } />
			<SectionHeader
				title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
				heading={ 3 }
				description={ __(
					'Allows Newspack to send enhanced custom event data to your Google Analytics.',
					'newspack-plugin'
				) }
				noMargin
			/>
			<CustomEvents />
		</div>
	);
};

export default Connections;
