/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { trash, pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	ButtonCard,
	TextControl,
	Button,
	Card,
	Modal,
	Notice,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Advertising management screen.
 */
const AdUnits = ( {
	adUnits,
	onDelete,
	updateAdUnit,
	wizardApiFetch,
	service,
	serviceData,
	updateGAMCredentials,
	removeGAMCredentials,
	fetchAdvertisingData,
} ) => {
	const warningNoticeText = `${ __(
		'Please connect your Google account using the Newspack dashboard in order to use ad units from your GAM account.',
		'newspack'
	) } ${
		Object.values( adUnits ).length
			? __( 'The legacy ad units will continue to work.', 'newspack' )
			: ''
	}`;
	const gamConnectionMessage = serviceData?.status?.error
		? `${ __( 'Google Ad Manager connection error', 'newspack' ) }: ${ serviceData.status.error }`
		: false;

	const isDisplayingNetworkMismatchNotice =
		! gamConnectionMessage && false === serviceData.status?.is_network_code_matched;

	const [ networkCode, setNetworkCode ] = useState( serviceData.status.network_code );
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
		setNetworkCode( serviceData.status.network_code );
	}, [ serviceData.status.network_code ] );

	const credentialsInputFile = useRef( null );

	const [ isRemoving, setIsRemoving ] = useState( false );

	return (
		<>
			{ serviceData.status.can_connect ? (
				<>
					{ isDisplayingNetworkMismatchNotice && (
						<Notice
							noticeText={ __(
								'Your GAM network code is different than the network code the site was configured with. Legacy ad units are likely to not load.',
								'newspack'
							) }
							isWarning
						/>
					) }
					{ serviceData.status.connected === false && (
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
				</>
			) : (
				<>
					<Notice
						noticeText={ __( 'Currently operating in legacy mode.', 'newspack' ) }
						isWarning
					/>
					{ ! serviceData.status.incompatible && (
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
			<div className="flex items-end" style={ { margin: '-30px 0' } }>
				<TextControl
					className="mr2"
					label={ __( 'Network code', 'newspack' ) }
					value={ networkCode }
					onChange={ setNetworkCode }
					disabled={ serviceData.status.connected }
				/>
				<Card buttonsCard noBorder>
					{ ! serviceData.status.connected ? (
						<Button onClick={ saveNetworkCode } isPrimary disabled={ serviceData.status.connected }>
							{ __( 'Save', 'newspack' ) }
						</Button>
					) : (
						<>
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
				</Card>
			</div>
			<p>
				{ __(
					'Set up multiple ad units to use on your homepage, articles and other places throughout your site.'
				) }
				<br />
				{ __(
					'You can place ads through our Newspack Ad Block in the Editor, Newspack Ad widget, and using the global placements.'
				) }
			</p>
			<Card noBorder>
				{ Object.values( adUnits )
					.sort( ( a, b ) => b.name.localeCompare( a.name ) )
					.sort( a => ( a.is_legacy ? 1 : -1 ) )
					.map( adUnit => {
						const editLink = `#${ service }/${ adUnit.id }`;
						const buttonProps = {
							isQuaternary: true,
							isSmall: true,
							tooltipPosition: 'bottom center',
						};
						const displayLegacyAdUnitLabel = serviceData.status.can_connect && adUnit.is_legacy;
						return (
							<ActionCard
								key={ adUnit.id }
								title={ adUnit.name }
								isSmall
								titleLink={ editLink }
								className="mv0"
								{ ...( adUnit.is_legacy
									? {}
									: {
											toggleChecked: adUnit.status === 'ACTIVE',
											toggleOnChange: value => {
												adUnit.status = value ? 'ACTIVE' : 'INACTIVE';
												updateAdUnit( adUnit );
											},
									  } ) }
								description={ () => (
									<span>
										{ displayLegacyAdUnitLabel ? (
											<>
												<i>{ __( 'Legacy ad unit.', 'newspack' ) }</i> |{ ' ' }
											</>
										) : null }
										{ __( 'Sizes:', 'newspack' ) }{ ' ' }
										{ adUnit.sizes.map( ( size, i ) => (
											<code key={ i }>{ size.join( 'x' ) }</code>
										) ) }
									</span>
								) }
								actionText={
									<div className="flex items-center">
										<Button
											href={ editLink }
											icon={ pencil }
											label={ __( 'Edit the ad unit', 'newspack' ) }
											{ ...buttonProps }
										/>
										<Button
											onClick={ () => onDelete( adUnit.id ) }
											icon={ trash }
											label={ __( 'Archive the ad unit', 'newspack' ) }
											{ ...buttonProps }
										/>
									</div>
								}
							/>
						);
					} ) }
			</Card>
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

export default withWizardScreen( AdUnits );
