/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	TextControl,
	Card,
	Button,
	Modal,
	ButtonCard,
	Notice,
	Grid,
	withWizardScreen,
} from '../../../../components/src';
import AdUnits from '../../components/ad-units';

/**
 * Advertising management screen.
 */
const GAM = ( {
	adUnits,
	wizardApiFetch,
	serviceData,
	updateGAMCredentials,
	removeGAMCredentials,
	fetchAdvertisingData,
	onDeleteAdUnit,
	updateAdUnit,
} ) => {
	const { status } = serviceData;
	const warningNoticeText = `${ __(
		'Please connect your Google account using the Newspack dashboard in order to use ad units from your GAM account.',
		'newspack'
	) } ${
		Object.values( adUnits ).length
			? __( 'The legacy ad units will continue to work.', 'newspack' )
			: ''
	}`;
	const gamConnectionMessage = serviceData?.status?.error
		? `${ __( 'Google Ad Manager connection error', 'newspack' ) }: ${ status.error }`
		: false;

	const [ networkCode, setNetworkCode ] = useState( status.network_code );
	const saveNetworkCode = async () => {
		await wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/network_code/',
			method: 'POST',
			data: { network_code: networkCode },
			quiet: true,
		} );
		fetchAdvertisingData( true );
	};

	const [ fileError, setFileError ] = useState( '' );
	const handleCredentialsFile = event => {
		if ( event.target.files.length && event.target.files[ 0 ] ) {
			const reader = new FileReader();
			reader.readAsText( event.target.files[ 0 ], 'UTF-8' );
			reader.onload = function ( ev ) {
				let credentials;
				try {
					credentials = JSON.parse( ev.target.result );
				} catch ( error ) {
					setFileError( __( 'Invalid JSON file', 'newspack' ) );
					return;
				}
				updateGAMCredentials( credentials );
			};
			reader.onerror = function () {
				setFileError( __( 'Unable to read file', 'newspack' ) );
			};
		}
	};

	useEffect( () => {
		setNetworkCode( status.network_code );
	}, [ status.network_code ] );

	const credentialsInputFile = useRef( null );

	const [ isRemoving, setIsRemoving ] = useState( false );

	return (
		<>
			{ status.can_connect && ! status.connected && (
				<>
					<Notice
						noticeText={ gamConnectionMessage || warningNoticeText }
						isWarning={ ! gamConnectionMessage }
						isError={ gamConnectionMessage }
					/>
					<Button
						isSecondary
						onClick={ () => {
							credentialsInputFile.current.click();
						} }
					>
						{ __( 'Upload new credentials', 'newspack' ) }
					</Button>
				</>
			) }
			{ ! status.can_connect && (
				<>
					<Notice
						noticeText={ __( 'Currently operating in legacy mode.', 'newspack' ) }
						isWarning
					/>
					{ ! status.incompatible && (
						<ButtonCard
							onClick={ () => {
								credentialsInputFile.current.click();
							} }
							title={ __( 'Connect your GAM account', 'newspack' ) }
							desc={ [
								__(
									'Upload your Service Account credentials file to connect your GAM account with Newspack Ads.',
									'newspack'
								),
								fileError && <Notice noticeText={ fileError } isError />,
							] }
						/>
					) }
				</>
			) }
			{ serviceData.created_targeting_keys?.length > 0 && (
				<Notice
					noticeText={ [
						__( 'Created custom targeting keys:' ) + '\u00A0',
						serviceData.created_targeting_keys.join( ', ' ) + '. \u00A0',
						<ExternalLink
							href={ `https://admanager.google.com/${ serviceData.network_code }#inventory/custom_targeting/list` }
							key="google-ad-manager-custom-targeting-link"
						>
							{ __( 'Visit your GAM dashboard' ) }
						</ExternalLink>,
					] }
					isSuccess
				/>
			) }
			<div className="newspack-gam-connection">
				<TextControl
					className="mr2"
					label={ __( 'Network code', 'newspack' ) }
					value={ networkCode }
					onChange={ setNetworkCode }
					disabled={ status.connected }
				/>
				{ ! status.connected ? (
					<Button onClick={ saveNetworkCode } isPrimary disabled={ status.connected }>
						{ __( 'Save', 'newspack' ) }
					</Button>
				) : (
					<>
						<div className="spacer" />
						<Button
							onClick={ () => {
								credentialsInputFile.current.click();
							} }
							isSecondary
						>
							{ __( 'Upload new credentials', 'newspack' ) }
						</Button>
						<Button
							onClick={ () => {
								setIsRemoving( true );
							} }
							isDestructive
						>
							{ __( 'Remove credentials', 'newspack' ) }
						</Button>
					</>
				) }
				{ isRemoving && (
					<Modal
						title={ __( 'Remove Service Account Credentials', 'newspack' ) }
						onRequestClose={ () => setIsRemoving( false ) }
					>
						<p>
							{ __(
								'The credentials will be removed and Newspack Ads will no longer be connected to this Google Ad Manager account.',
								'newspack'
							) }
						</p>
						<Card buttonsCard noBorder className="justify-end">
							<Button
								isDestructive
								onClick={ () => {
									removeGAMCredentials();
									setIsRemoving( false );
								} }
							>
								{ __( 'Remove credentials', 'newspack' ) }
							</Button>
							<Button isSecondary onClick={ () => setIsRemoving( false ) }>
								{ __( 'Cancel', 'newspack' ) }
							</Button>
						</Card>
					</Modal>
				) }
			</div>
			{ ! status.can_connect ? (
				<AdUnits
					serviceData={ serviceData }
					adUnits={ adUnits }
					onDelete={ onDeleteAdUnit }
					updateAdUnit={ updateAdUnit }
				/>
			) : (
				<Grid columns={ 2 } gutter={ 32 }>
					<ButtonCard
						title={ __( 'Ad Units', 'newspack' ) }
						desc={ __(
							'Set up multiple ad units to use on your homepage, articles and other places throughout your site.',
							'newspack'
						) }
						href="#/gam/ad-units"
						chevron
					/>
					{ status.connected && (
						<ButtonCard
							title={ __( 'Orders & Line Items', 'newspack' ) }
							desc={ __(
								'Setup your ad buyers and how ad creatives are shown on your site.',
								'newspack'
							) }
							href="#/gam/orders"
							chevron
						/>
					) }
				</Grid>
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

export default withWizardScreen( GAM );
