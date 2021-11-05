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
import FivetranConnection from './fivetran';

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
		return <Waiting isCenter size={ 42 } />;
	}

	return (
		<>
			{ error && <Notice isError>{ error }</Notice> }
			<WPCOMAuth onStatusChange={ setIsWPCOMConnected } />
			<GoogleAuth setError={ setError } canBeConnected={ isWPCOMConnected === true } />
			<FivetranConnection setError={ setError } wpComStatus={ isWPCOMConnected } />
		</>
	);
};

export default Main;
