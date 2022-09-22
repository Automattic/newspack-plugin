/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ButtonCard, Grid, Notice, SectionHeader } from '../../../../components/src';
import { handleJSONFile } from '../../components/utils';

const ServiceAccountConnection = ( { updateWithAPI, isConnected } ) => {
	const credentialsInputFile = useRef( null );
	const [ fileError, setFileError ] = useState( '' );

	const updateGAMCredentials = credentials =>
		updateWithAPI( {
			path: '/newspack/v1/wizard/billboard/credentials',
			method: 'post',
			data: { credentials },
			quiet: true,
		} );
	const removeGAMCredentials = () =>
		updateWithAPI( {
			path: '/newspack/v1/wizard/billboard/credentials',
			method: 'delete',
			quiet: true,
		} );

	const handleCredentialsFile = event => {
		if ( event.target.files.length && event.target.files[ 0 ] ) {
			handleJSONFile( event.target.files[ 0 ] )
				.then( credentials => updateGAMCredentials( credentials ) )
				.catch( err => setFileError( err ) );
		}
	};

	return (
		<>
			<SectionHeader title={ __( 'Service Account connection', 'newspack' ) } />
			{ isConnected ? (
				<Grid>
					<ButtonCard
						isSmall
						onClick={ () => credentialsInputFile.current.click() }
						title={ __( 'Update Service Account credentials', 'newspack' ) }
						chevron
					/>
					<ButtonCard
						isSmall
						onClick={ removeGAMCredentials }
						isDestructive
						title={ __( 'Remove Service Account credentials', 'newspack' ) }
						chevron
					/>
				</Grid>
			) : (
				<ButtonCard
					onClick={ () => credentialsInputFile.current.click() }
					title={ __( 'Connect your Google Ad Manager account', 'newspack' ) }
					desc={ [
						__(
							'Upload your Service Account credentials file to connect your GAM account with Newspack Ads.',
							'newspack'
						),
						fileError && <Notice noticeText={ fileError } isError />,
					] }
					chevron
				/>
			) }
			<input
				type="file"
				accept=".json"
				ref={ credentialsInputFile }
				style={ { display: 'none' } }
				onChange={ handleCredentialsFile }
			/>
		</>
	);
};

export default ServiceAccountConnection;
