/* global newspack_connections_data */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Notice, SectionHeader, Waiting } from '../../../../components/src';
import Plugins from './plugins';
import GoogleAuth, { handleGoogleRedirect } from './google';
import Mailchimp from './mailchimp';
import FivetranConnection from './fivetran';

const Main = () => {
	const [ error, setError ] = useState();
	const [ isResolvingAuth, setIsResolvingAuth ] = useState( true );
	useEffect( () => {
		handleGoogleRedirect( { setError } ).finally( () => {
			setIsResolvingAuth( false );
		} );
	}, [] );

	if ( isResolvingAuth ) {
		return <Waiting isCenter />;
	}

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
					<FivetranConnection
						isResolvingAuth={ isResolvingAuth }
						setIsResolvingAuth={ setIsResolvingAuth }
						setError={ setError }
					/>
				</>
			) }
		</>
	);
};

export default Main;
