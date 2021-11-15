/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { trash, pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	TextControl,
	Button,
	Card,
	Notice,
	withWizardScreen,
} from '../../../../components/src';
import ServiceAccountConnection from './service-account-connection';

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
	fetchAdvertisingData,
} ) => {
	const gamConnectionErrorMessage = serviceData?.status?.error
		? `${ __( 'Google Ad Manager connection issue', 'newspack' ) }: ${ serviceData.status.error }`
		: false;

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

	useEffect( () => {
		setNetworkCode( serviceData.status.network_code );
	}, [ serviceData.status.network_code ] );

	const { can_use_service_account, can_use_oauth, connection_mode } = serviceData.status;
	const isLegacy = 'legacy' === connection_mode;

	return (
		<>
			{ false === serviceData.status?.is_network_code_matched && (
				<Notice
					noticeText={ __(
						'Your GAM network code is different than the network code the site was configured with. Legacy ad units are likely to not load.',
						'newspack'
					) }
					isWarning
				/>
			) }
			{ gamConnectionErrorMessage && <Notice noticeText={ gamConnectionErrorMessage } isError /> }
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
			{ isLegacy && (
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
							<Button onClick={ saveNetworkCode } isPrimary>
								{ __( 'Save', 'newspack' ) }
							</Button>
						</span>
					</div>
				</>
			) }
			{ ! isLegacy && networkCode && (
				<div>
					<strong>{ __( 'Connected GAM network code:', 'newspack' ) } </strong>
					<code>{ networkCode }</code>
				</div>
			) }
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
			{ can_use_service_account && connection_mode !== 'oauth' && (
				<ServiceAccountConnection
					className="mt3"
					updateWithAPI={ updateWithAPI }
					isConnected={ serviceData.status.connected }
				/>
			) }
		</>
	);
};

export default withWizardScreen( AdUnits );
