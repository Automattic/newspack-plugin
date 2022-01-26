/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink, Path, SVG } from '@wordpress/components';
import { pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	TextControl,
	SelectControl,
	Button,
	Card,
	Notice,
	withWizardScreen,
} from '../../../../components/src';
import ServiceAccountConnection from './service-account-connection';

export const archive = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="m15.976 14.139-3.988 3.418L8 14.14 8.976 13l2.274 1.949V10.5h1.5v4.429L15 13l.976 1.139Z" />
		<Path
			clipRule="evenodd"
			d="M4 9.232A2 2 0 0 1 3 7.5V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2 2 0 0 1-1 1.732V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.232ZM5 5.5h14a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5Zm.5 4V18a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V9.5h-13Z"
			fillRule="evenodd"
		/>
	</SVG>
);

/**
 * Advertising management screen.
 */
const AdUnits = ( {
	adUnits,
	onDelete,
	updateAdUnit,
	wizardApiFetch,
	updateWithAPI,
	service,
	serviceData,
	toggleService,
	fetchAdvertisingData,
} ) => {
	const gamErrorMessage = serviceData?.status?.error
		? `${ __( 'Google Ad Manager Error', 'newspack' ) }: ${ serviceData.status.error }`
		: false;

	const updateNetworkCode = async ( value, isGam ) => {
		await wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/network_code/',
			method: 'POST',
			data: { network_code: value, is_gam: isGam },
			quiet: true,
		} );
		fetchAdvertisingData( true );
	};

	const updateGAMNetworkCode = async value => {
		updateNetworkCode( value, true );
	};

	const [ networkCode, setNetworkCode ] = useState( serviceData.status.network_code );
	const updateLegacyNetworkCode = async () => {
		updateNetworkCode( networkCode, false );
	};

	useEffect( () => {
		setNetworkCode( serviceData.status.network_code );
	}, [ serviceData.status.network_code ] );

	const { can_use_service_account, can_use_oauth, connection_mode } = serviceData.status;
	const isLegacy = 'legacy' === connection_mode;

	return (
		<>
			<ActionCard
				title={ __( 'Google Ad Manager' ) }
				description={ __(
					'An advanced ad inventory creation and management platform, allowing you to be specific about ad placements.'
				) }
				toggle
				toggleChecked={ serviceData && serviceData.enabled }
				toggleOnChange={ value => toggleService( 'google_ad_manager', value ) }
				titleLink={ serviceData ? '#/google_ad_manager' : null }
				href={ serviceData && '#/google_ad_manager' }
				notification={
					serviceData.status.error
						? [ serviceData.status.error ]
						: serviceData.created_targeting_keys?.length > 0 && [
								__( 'Created custom targeting keys:' ) + '\u00A0',
								serviceData.created_targeting_keys.join( ', ' ) + '. \u00A0',
								// eslint-disable-next-line react/jsx-indent
								<ExternalLink
									href={ `https://admanager.google.com/${ serviceData.network_code }#inventory/custom_targeting/list` }
									key="google-ad-manager-custom-targeting-link"
								>
									{ __( 'Visit your GAM dashboard' ) }
								</ExternalLink>,
						  ]
				}
				notificationLevel={ serviceData.created_targeting_keys?.length ? 'success' : 'error' }
			/>
			{ ! isLegacy && networkCode && serviceData.enabled && (
				<SelectControl
					label={ __( 'Connected GAM network code', 'newspack' ) }
					value={ networkCode }
					options={ serviceData.available_networks.map( network => ( {
						label: `${ network.name } (${ network.code })`,
						value: network.code,
					} ) ) }
					onChange={ updateGAMNetworkCode }
				/>
			) }
			{ false === serviceData.status?.is_network_code_matched && (
				<Notice
					noticeText={ __(
						'Your GAM network code is different than the network code the site was configured with. Legacy ad units are likely to not load.',
						'newspack'
					) }
					isWarning
				/>
			) }
			{ gamErrorMessage && <Notice noticeText={ gamErrorMessage } isError /> }
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
			{ isLegacy && serviceData.enabled && (
				<>
					{ ( can_use_service_account || can_use_oauth ) && (
						<Notice
							noticeText={ __( 'Currently operating in legacy mode.', 'newspack' ) }
							isWarning
						/>
					) }
					<div className="flex items-end">
						<TextControl
							label={ __( 'Network Code', 'newspack' ) }
							value={ networkCode }
							onChange={ setNetworkCode }
							withMargin={ false }
						/>
						<span className="pl3">
							<Button onClick={ updateLegacyNetworkCode } isPrimary>
								{ __( 'Save', 'newspack' ) }
							</Button>
						</span>
					</div>
				</>
			) }
			{ serviceData.enabled && (
				<>
					<p>
						{ __(
							'Set up multiple ad units to use on your homepage, articles and other places throughout your site.',
							'newspack'
						) }
						<br />
						{ __(
							'You can place ads through our Newspack Ad Block in the Editor, Newspack Ad widget, and using the global placements.',
							'newspack'
						) }
					</p>
					<Card noBorder>
						{ Object.values( adUnits )
							.filter( adUnit => adUnit.id !== 0 )
							.sort( ( a, b ) => b.name.localeCompare( a.name ) )
							.sort( a => ( a.is_legacy ? 1 : -1 ) )
							.map( adUnit => {
								const editLink = `#${ service }/${ adUnit.id }`;
								const buttonProps = {
									isQuaternary: true,
									isSmall: true,
									tooltipPosition: 'bottom center',
								};
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
												{ adUnit.is_legacy ? (
													<>
														<i>{ __( 'Legacy ad unit.', 'newspack' ) }</i> |{ ' ' }
													</>
												) : null }
												{ __( 'Sizes:', 'newspack' ) }{ ' ' }
												{ adUnit.sizes.map( ( size, i ) => (
													<code key={ i }>{ size.join( 'x' ) }</code>
												) ) }
												{ adUnit.fluid && <code>{ __( 'Fluid', 'newspack' ) }</code> }
											</span>
										) }
										actionText={
											<div className="flex items-center">
												<Button
													href={ editLink }
													icon={ pencil }
													label={ __( 'Edit Ad Unit', 'newspack' ) }
													{ ...buttonProps }
												/>
												<Button
													onClick={ () => onDelete( adUnit.id ) }
													icon={ archive }
													label={ __( 'Archive Ad Unit', 'newspack' ) }
													{ ...buttonProps }
												/>
											</div>
										}
									/>
								);
							} ) }
					</Card>
					{ can_use_service_account && connection_mode !== 'oauth' && (
						<ServiceAccountConnection
							updateWithAPI={ updateWithAPI }
							isConnected={ serviceData.status.connected }
						/>
					) }
				</>
			) }
		</>
	);
};

export default withWizardScreen( AdUnits );
