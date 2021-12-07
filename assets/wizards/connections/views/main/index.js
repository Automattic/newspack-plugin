/* global newspack_connections_data */

/**
 * WordPress dependencies.
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Waiting, Notice } from '../../../../components/src';
import WPCOMAuth from './wpcom';
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
			{ newspack_connections_data.can_connect_wpcom && <WPCOMAuth /> }
			{ newspack_connections_data.can_connect_google && <GoogleAuth setError={ setError } /> }
			<Mailchimp setError={ setError } />
			{ newspack_connections_data.can_connect_fivetran && (
				<FivetranConnection setError={ setError } />
			) }
		</>
	);
};

export default Main;
