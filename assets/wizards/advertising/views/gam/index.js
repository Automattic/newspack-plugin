/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	TextControl,
	Button,
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
	fetchAdvertisingData,
	onDeleteAdUnit,
	updateAdUnit,
} ) => {
	const { status } = serviceData;
	const gamConnectionErrorMessage = status?.error
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

	useEffect( () => {
		setNetworkCode( status.network_code );
	}, [ status.network_code ] );

	return (
		<>
			{ status.can_connect && gamConnectionErrorMessage && (
				<Notice noticeText={ gamConnectionErrorMessage } isError />
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
			{ status.can_use_oauth && status.mode !== 'oauth' && (
				<Notice isWarning>
					<>
						<span>
							{ __(
								'You are currently using a legacy version of Google Ad Manager connection. Visit the "Connections" wizard of Newspack plugin to connect your Google account.',
								'newspack'
							) }
						</span>
						{ status.mode === 'service_account' && (
							<span>
								{ ' ' }
								{ __(
									'Afterwards, remove the service account credentials from the database.',
									'newspack'
								) }
							</span>
						) }
					</>
				</Notice>
			) }
			{ status.mode === 'legacy' ? (
				<div className="flex items-end">
					<TextControl
						label={ __( 'Network Code', 'newspack' ) }
						value={ networkCode }
						onChange={ setNetworkCode }
						withMargin={ false }
					/>
					<span className="pl3">
						<Button onClick={ saveNetworkCode } isPrimary disabled={ status.connected }>
							{ __( 'Save', 'newspack' ) }
						</Button>
					</span>
				</div>
			) : (
				<div className="mb3">
					<strong>{ __( 'Network code:', 'newspack' ) } </strong>
					<code>{ networkCode }</code>
				</div>
			) }
			{ ! status.can_connect || ! status.connected ? (
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
		</>
	);
};

export default withWizardScreen( GAM );
