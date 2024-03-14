/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useRef, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Card, ButtonCard, Notice, TextControl } from '../../../../components/src';
import GoogleOAuth from '../../../connections/views/main/google';
import { handleJSONFile } from '../utils';

export default function AdsOnboarding( { onUpdate, onSuccess } ) {
	const credentialsInputFile = useRef( null );
	const [ fileError, setFileError ] = useState( '' );
	const [ inFlight, setInFlight ] = useState( false );
	const [ networkCode, setNetworkCode ] = useState( '' );
	const [ isConnected, setIsConnected ] = useState( false );
	const [ useOAuth, setUseOAuth ] = useState( null );

	const updateGAMCredentials = credentials => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/billboard/credentials',
			method: 'post',
			data: { credentials, onboarding: true },
		} )
			.then( () => {
				setIsConnected( true );
				if ( typeof onSuccess === 'function' ) onSuccess();
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};

	const handleCredentialsFile = event => {
		if ( event.target.files.length && event.target.files[ 0 ] ) {
			handleJSONFile( event.target.files[ 0 ] )
				.then( credentials => updateGAMCredentials( credentials ) )
				.catch( err => setFileError( err ) );
		}
	};

	useEffect( () => {
		if ( typeof onUpdate === 'function' ) {
			onUpdate( { networkCode } );
		}
	}, [ networkCode ] );

	return (
		<Card noBorder>
			<div className="ads-onboarding">
				{ ( true === useOAuth || null === useOAuth ) && (
					<Fragment>
						{ useOAuth && (
							<p>
								{ __(
									'Authenticate with Google in order to connect your Google Ad Manager account:',
									'newspack-plugin'
								) }
							</p>
						) }
						<GoogleOAuth onInit={ err => setUseOAuth( ! err ) } onSuccess={ onSuccess } />
					</Fragment>
				) }
				{ false === useOAuth && (
					<Fragment>
						{ isConnected ? (
							<Notice isSuccess noticeText={ __( "We're all set here!", 'newspack-plugin' ) } />
						) : (
							<Fragment>
								<p>
									{ __(
										'Enter your Google Ad Manager network code and service account credentials for a full integration:',
										'newspack-plugin'
									) }
								</p>
								<TextControl
									disabled={ inFlight }
									isWide
									name="network_code"
									label={ __( 'Network code', 'newspack-plugin' ) }
									value={ networkCode }
									onChange={ setNetworkCode }
								/>
								<ButtonCard
									disabled={ inFlight }
									onClick={ () => credentialsInputFile.current.click() }
									title={ __( 'Upload credentials', 'newspack-plugin' ) }
									desc={ [
										__(
											'Upload your Service Account credentials file to connect your GAM account.',
											'newspack-plugin'
										),
										fileError && <Notice noticeText={ fileError } isError />,
									] }
									chevron
								/>
								<p>
									<a
										href="https://developers.google.com/ad-manager/api/authentication"
										target="_blank"
										rel="noopener noreferrer"
									>
										{ __( 'How to get a service account user for API access', 'newspack-plugin' ) }
									</a>
									.
								</p>
								<input
									type="file"
									accept=".json"
									ref={ credentialsInputFile }
									style={ { display: 'none' } }
									onChange={ handleCredentialsFile }
								/>
							</Fragment>
						) }
					</Fragment>
				) }
			</div>
		</Card>
	);
}
