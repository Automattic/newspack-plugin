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
			<WPCOMAuth />
			<GoogleAuth setError={ setError } />
			<Mailchimp setError={ setError } />
			<FivetranConnection setError={ setError } />
		</>
	);
};

export default Main;
