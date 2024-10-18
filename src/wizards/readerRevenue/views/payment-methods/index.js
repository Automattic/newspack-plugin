/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl, ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Grid,
	Notice,
	PluginInstaller,
	SectionHeader,
	TextControl,
	Wizard,
} from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';
import './style.scss';

const StripeSettings = ( { stripe, changeHandler, onSave } ) => {
	const testMode = stripe?.testMode;
	const isConnectedApi = testMode ? stripe?.is_connected_api_test : stripe?.is_connected_api_live;
	const isConnectedOauth = testMode ? stripe?.is_connected_oauth_test : stripe?.is_connected_oauth_live;
	const getConnectionStatus = () => {
		if ( ! isConnectedApi ) {
			return __( 'Not connected', 'newspack-plugin' );
		}
		if ( ! isConnectedOauth ) {
			return __( 'Needs attention', 'newspack-plugin' );
		}
		if ( testMode ) {
			return __( 'Connected in test mode', 'newspack-plugin' );
		}
		return __( 'Connected', 'newspack-plugin' );
	}
	return (
		<>
			<ActionCard
				title={ __( 'Connection Status', 'newspack-plugin' ) }
				description={ getConnectionStatus() }
				actionText={
					! isConnectedApi || ! isConnectedOauth ? (
						<ExternalLink href="/wp-admin/admin.php?page=wc-settings&tab=checkout&section=stripe&panel=methods">
							{ __( 'Connect', 'newspack-plugin' ) }
						</ExternalLink>
					) : null
				}
				checkbox={ isConnectedApi && isConnectedOauth ? 'checked' : 'unchecked' }
				isPending={ ! isConnectedApi || ! isConnectedOauth }
				hasWhiteHeader
				isSmall
			/>
			{ ( isConnectedApi || isConnectedOauth ) && (
				<>
					<SectionHeader
						title={ __( 'Additional Settings', 'newspack-plugin' ) }
						description={ __(
							'Configure Newspack-exclusive Stripe settings.',
							'newspack-plugin'
						) }
					/>
					<ActionCard
						title={ __( 'Collect transaction fees', 'newspack-plugin' ) }
						description={ __( 'Allow donors to optionally cover the Stripe transaction fee.', 'newspack-plugin' ) }
						notificationLevel="info"
						toggleChecked={ stripe.allow_covering_fees }
						toggleOnChange={ () => changeHandler( 'allow_covering_fees', ! stripe.allow_covering_fees ) }
						hasWhiteHeader
						noBorder
						isSmall
					>
						{ stripe.allow_covering_fees && (
							<>
								<p>
									{ __(
										'Stripe’s standard transaction fee is 2.9% + 30¢ per successful charge. If your account has different pricing, adjust the fee structure below. ',
										'newspack-plugin'
									) }
									<ExternalLink href="https://stripe.com/pricing">
										{ __( 'Learn more', 'newspack-plugin' ) }
									</ExternalLink>
								</p>
								<Grid noMargin rowGap={ 16 }>
									<TextControl
										type="number"
										step="0.1"
										value={ stripe.fee_multiplier }
										label={ __( 'Fee multiplier', 'newspack-plugin' ) }
										onChange={ value => changeHandler( 'fee_multiplier', value ) }
									/>
									<TextControl
										type="number"
										step="0.1"
										value={ stripe.fee_static }
										label={ __( 'Fee static portion', 'newspack-plugin' ) }
										onChange={ value => changeHandler( 'fee_static', value ) }
									/>
									<TextControl
										value={ stripe.allow_covering_fees_label }
										label={ __( 'Custom message', 'newspack-plugin' ) }
										placeholder={ __(
											'A message to explain the transaction fee option (optional).',
											'newspack-plugin'
										) }
										onChange={ value => changeHandler( 'allow_covering_fees_label', value ) }
									/>
									<CheckboxControl
										label={ __( 'Cover fees by default', 'newspack-plugin' ) }
										checked={ stripe.allow_covering_fees_default }
										onChange={ () => changeHandler( 'allow_covering_fees_default', ! stripe.allow_covering_fees_default ) }
										help={ __(
											'If enabled, the option to cover the transaction fee will be checked by default.',
											'newspack-plugin'
										) }
									/>
								</Grid>
							</>
						) }
						<div className="newspack-buttons-card">
							<Button isPrimary onClick={ onSave }>
								{ __( 'Save Settings', 'newspack-plugin' ) }
							</Button>
						</div>
					</ActionCard>
				</>
			) }
		</>
	);
}

const Stripe = (
	{
		errors,
		is_ssl,
		stripe,
		changeHandler,
		onSave,
		updateWizardSettings
	}
) => {
	if ( ! stripe ) {
		return (
			<PluginInstaller
				plugins={ [ 'woocommerce-gateway-stripe' ] }
				onStatus={ ( { complete } ) => {
					if ( complete ) {
						updateWizardSettings( {
							slug: 'newspack-reader-revenue-wizard',
							path: [ 'stripe_data' ],
							value: { activate: true },
						} );
						onSave();
					}
				} }
				withoutFooterButton={ true }
			/>
		);
	}

	return (
		<ActionCard
			isMedium
			title={ __( 'Stripe', 'newspack-plugin' ) }
			description={ () => (
				<>
					{ __(
						'Enable the Stripe payment gateway for WooCommerce. ',
						'newspack-plugin'
					) }
					<ExternalLink href="https://woocommerce.com/document/stripe/">
						{ __( 'Learn more', 'newspack-plugin' ) }
					</ExternalLink>
				</>
			) }
			hasGreyHeader={ !! stripe.enabled }
			hasWhiteHeader={ ! stripe.enabled }
			toggleChecked={ !! stripe.enabled }
			toggleOnChange={ () => {
				changeHandler( 'enabled', ! stripe.enabled );
				onSave();
			} }
			actionContent={ stripe.enabled && (
				<Button
					variant="secondary"
					href="/wp-admin/admin.php?page=wc-settings&tab=checkout&section=stripe&panel=settings"
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Configure', 'newspack-plugin' ) }
				</Button>
			) }
		>
			{ stripe.enabled && (
				<>
					{ errors.length > 0 &&
						errors.map( ( error, index ) => (
							<Notice isError key={ index } noticeText={ <span>{ error.message }</span> } />
						) ) }
					{ is_ssl === false && (
						<Notice
							isWarning
							noticeText={
								<>
									{ __(
										'Missing or invalid SSL configuration detected. To use Stripe, the site must be secured with SSL. ',
										'newspack-plugin'
									) }
									<ExternalLink href="https://stripe.com/docs/security/guide">
										{ __( 'Learn more', 'newspack-plugin' ) }
									</ExternalLink>
								</>
							}
						/>
					) }
					{ stripe && (
						<StripeSettings
							stripe={ stripe }
							changeHandler={ changeHandler }
							onSave={ onSave }
							/>
					) }
				</>
			) }
		</ActionCard>
	);
}

const PaymentGateways = () => {
	const { stripe_data: stripe = {}, is_ssl, errors = [] } = Wizard.useWizardData( 'reader-revenue' );
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = ( key, value ) =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'stripe_data', key ],
			value,
		} );

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'stripe',
			payloadPath: [ 'stripe_data' ],
		} );

	return (
		<>
			<SectionHeader
				title={ __( 'Payment Methods', 'newspack-plugin' ) }
				description={ () => (
					<>
						{ __(
							'Configure Newspack-supported payment gateways for WooCommerce. Payment gateways allow you to accept various payment methods from your readers. ',
							'newspack-plugin'
						) }
						<ExternalLink href="https://woocommerce.com/document/premium-payment-gateway-extensions/">
							{ __( 'Learn more', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				) }
			/>
			<Stripe
				errors={ errors }
				is_ssl={ is_ssl }
				stripe={ stripe }
				changeHandler={ changeHandler }
				onSave={ onSave }
				updateWizardSettings={ updateWizardSettings }
			/>
		</>
	);
};

export default PaymentGateways;
