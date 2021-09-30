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

const Main = () => {
	const [ error, setError ] = useState();
	const [ isResolvingAuth, setIsResolvingAuth ] = useState( true );
	const [ isWPCOMConnected, setIsWPCOMConnected ] = useState();
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
			<WPCOMAuth onStatusChange={ setIsWPCOMConnected } />
			<GoogleAuth setError={ setError } canBeConnected={ isWPCOMConnected === true } />
			<Mailchimp setError={ setError } />
		</>
	);
};

export default Main;
