/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	gamConnectionStatus = {},
} ) => {
	const warningNoticeText = `${ __(
		'Please connect your Google account using the Newspack dashboard in order to use ad units from your GAM account.',
		'newspack'
	) } ${
		Object.values( adUnits ).length
			? __( 'The legacy ad units will continue to work.', 'newspack' )
			: ''
	}`;
	const gamConnectionMessage = gamConnectionStatus?.error
		? `${ __( 'Google Ad Manager connection error', 'newspack' ) }: ${ gamConnectionStatus.error }`
		: false;

	const isDisplayingNetworkMismatchNotice =
		! gamConnectionMessage && false === gamConnectionStatus?.is_network_code_matched;

	const [ networkCode, setNetworkCode ] = useState( gamConnectionStatus.network_code );
	const saveNetworkCode = () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/advertising/network_code/',
			method: 'POST',
			data: { network_code: networkCode },
			quiet: true,
		} );
	};

	return (
		<>
			{ gamConnectionStatus.can_connect ? (
				<>
					{ isDisplayingNetworkMismatchNotice && (
						<Notice
							noticeText={ __(
								'Your GAM network code is different than the network code the site was configured with. Editing has been disabled.',
								'newspack'
							) }
							isError
						/>
					) }
					{ gamConnectionStatus?.connected === false && (
						<Notice
							noticeText={ gamConnectionMessage || warningNoticeText }
							isWarning={ ! gamConnectionMessage }
							isError={ gamConnectionMessage }
						/>
					) }
				</>
			) : (
				<div className="flex items-end" style={ { margin: '-30px 0' } }>
					<TextControl
						className="mr2"
						label={ __( 'Network code', 'newspack' ) }
						value={ networkCode }
						onChange={ setNetworkCode }
					/>
					<div className="mb4">
						<Button onClick={ saveNetworkCode } isPrimary>
							{ __( 'Save', 'newspack' ) }
						</Button>
					</div>
				</div>
			) }
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
						const isDisabled = adUnit.is_legacy
							? false
							: false === gamConnectionStatus?.is_network_code_matched;
						const buttonProps = {
							disabled: isDisabled,
							isQuaternary: true,
							isSmall: true,
							tooltipPosition: 'bottom center',
						};
						const displayLegacyAdUnitLabel = gamConnectionStatus.can_connect && adUnit.is_legacy;
						return (
							<ActionCard
								disabled={ isDisabled }
								key={ adUnit.id }
								title={ adUnit.name }
								isSmall
								titleLink={ isDisabled ? null : editLink }
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
												<i>{ __( 'Legacy ad unit.', 'newspack' ) }</i> |{' '}
											</>
										) : null }
										{ __( 'Sizes:', 'newspack' ) }{' '}
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
		</>
	);
};

export default withWizardScreen( AdUnits );
