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
	fetchAdvertisingData,
} ) => {
	const gamConnectionErrorMessage = serviceData?.status?.error
		? `${ __( 'Google Ad Manager connection issue', 'newspack' ) }: ${ serviceData.status.error }`
		: false;

	const isDisplayingNetworkMismatchNotice =
		! gamConnectionErrorMessage && false === serviceData.status?.is_network_code_matched;

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
					{ gamConnectionErrorMessage && (
						<Notice noticeText={ gamConnectionErrorMessage } isError />
					) }
				</>
			) : null }
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
			{ serviceData.status.can_use_oauth && serviceData.status.mode !== 'oauth' && (
				<Notice isWarning>
					<>
						<span>
							{ __(
								'You are currently using a legacy version of Google Ad Manager connection. Visit the "Connections" wizard of Newspack plugin to connect your Google account.',
								'newspack'
							) }
						</span>
						{ serviceData.status.mode === 'service_account' && (
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
			{ serviceData.status.mode === 'legacy' ? (
				<div className="flex items-end">
					<TextControl
						label={ __( 'Network Code', 'newspack' ) }
						value={ networkCode }
						onChange={ setNetworkCode }
						withMargin={ false }
					/>
					<span className="pl3">
						<Button onClick={ saveNetworkCode } isPrimary disabled={ serviceData.status.connected }>
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
		</>
	);
};

export default withWizardScreen( AdUnits );
