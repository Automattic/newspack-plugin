/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl, ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

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

const Stripe = ( { stripe } ) => {
	const isLoading = useSelect( select => select( Wizard.STORE_NAMESPACE ).isLoading() );
	const isQuietLoading = useSelect( select => select( Wizard.STORE_NAMESPACE ).isQuietLoading() );
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = ( key, value ) =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'payment_gateways', 'stripe', key ],
			value,
		} );

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'stripe',
			payloadPath: [ 'payment_gateways', 'stripe' ],
		} );
	if ( ! stripe ) {
		return (
			<PluginInstaller
				plugins={ [ 'woocommerce-gateway-stripe' ] }
				onStatus={ ( { complete } ) => {
					if ( complete ) {
						updateWizardSettings( {
							slug: 'newspack-reader-revenue-wizard',
							path: [ 'payment_gateways', 'stripe' ],
							value: { activate: true },
						} );
						onSave();
					}
				} }
				withoutFooterButton={ true }
			/>
		);
	}
	const testMode = stripe?.testMode;
	const isConnectedApi = testMode ? stripe?.is_connected_api_test : stripe?.is_connected_api_live;
	const isConnectedOauth = testMode ? stripe?.is_connected_oauth_test : stripe?.is_connected_oauth_live;
	const getConnectionStatus = () => {
		if ( ! stripe?.enabled ) {
			return null;
		}
		if ( isLoading || isQuietLoading ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		if ( ! isConnectedApi ) {
			return __( 'Not connected', 'newspack-plugin' );
		}
		if ( ! isConnectedOauth ) {
			return __( 'Needs attention', 'newspack-plugin' );
		}
		if ( testMode ) {
			return __( 'Connected - test mode', 'newspack-plugin' );
		}
		return __( 'Connected', 'newspack-plugin' );
	}
	const getBadgeLevel = () => {
		if ( ! stripe?.enabled || isLoading || isQuietLoading ) {
			return 'info';
		}
		if ( ! isConnectedApi ) {
			return 'error';
		}
		if ( ! isConnectedOauth ) {
			return 'warning';
		}
		return 'success';
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
			hasWhiteHeader
			toggleChecked={ !! stripe.enabled }
			toggleOnChange={ () => {
				changeHandler( 'enabled', ! stripe.enabled );
				onSave();
			} }
			badge={ getConnectionStatus() }
			badgeLevel={ getBadgeLevel() }
			// eslint-disable-next-line no-nested-ternary
			actionContent={ ( ! stripe?.enabled || isLoading || isQuietLoading ) ? null : isConnectedOauth ? (
				<Button
					variant="secondary"
					href="/wp-admin/admin.php?page=wc-settings&tab=checkout&section=stripe&panel=settings"
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Configure', 'newspack-plugin' ) }
				</Button>
			) : (
				<Button
					variant="primary"
					href="/wp-admin/admin.php?page=wc-settings&tab=checkout&section=stripe&panel=payment-methods"
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Connect', 'newspack-plugin' ) }
				</Button>
			) }
		/>
	);
}

const AdditionalSettings = ( { settings } ) => {
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = ( key, value ) =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'additional_settings', key ],
			value,
		} );

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'settings',
			payloadPath: [ 'additional_settings' ],
		} );

	return (
		<>
			<SectionHeader
				title={ __( 'Additional Settings', 'newspack-plugin' ) }
				description={ __(
					'Configure Newspack-exclusive settings.',
					'newspack-plugin'
				) }
			/>
			<ActionCard
				isMedium
				title={ __( 'Collect transaction fees', 'newspack-plugin' ) }
				description={ __( 'Allow donors to optionally cover transaction fees imposed by payment processors.', 'newspack-plugin' ) }
				notificationLevel="info"
				toggleChecked={ settings.allow_covering_fees }
				toggleOnChange={ () => {
					changeHandler( 'allow_covering_fees', ! settings.allow_covering_fees );
					onSave();
				} }
				hasGreyHeader={ settings.allow_covering_fees }
				hasWhiteHeader={ ! settings.allow_covering_fees }
				actionContent={ settings.allow_covering_fees && (
					<Button isPrimary onClick={ onSave }>
						{ __( 'Save Settings', 'newspack-plugin' ) }
					</Button>
				) }
			>
				{ settings.allow_covering_fees && (
					<Grid noMargin rowGap={ 16 }>
						<TextControl
							type="number"
							step="0.1"
							value={ settings.fee_multiplier }
							label={ __( 'Fee multiplier', 'newspack-plugin' ) }
							onChange={ value => changeHandler( 'fee_multiplier', value ) }
						/>
						<TextControl
							type="number"
							step="0.1"
							value={ settings.fee_static }
							label={ __( 'Fee static portion', 'newspack-plugin' ) }
							onChange={ value => changeHandler( 'fee_static', value ) }
						/>
						<TextControl
							value={ settings.allow_covering_fees_label }
							label={ __( 'Custom message', 'newspack-plugin' ) }
							placeholder={ __(
								'A message to explain the transaction fee option (optional).',
								'newspack-plugin'
							) }
							onChange={ value => changeHandler( 'allow_covering_fees_label', value ) }
						/>
						<CheckboxControl
							label={ __( 'Cover fees by default', 'newspack-plugin' ) }
							checked={ settings.allow_covering_fees_default }
							onChange={ () => changeHandler( 'allow_covering_fees_default', ! settings.allow_covering_fees_default ) }
							help={ __(
								'If enabled, the option to cover the transaction fee will be checked by default.',
								'newspack-plugin'
							) }
						/>
					</Grid>
				) }
			</ActionCard>
		</>
	);
}

const PaymentGateways = () => {
	const { payment_gateways: paymentGateways = {}, is_ssl, errors = [], additional_settings: settings = {} } = Wizard.useWizardData( 'reader-revenue' );
	const { stripe = {} } = paymentGateways;

	return (
		<>
			<SectionHeader
				title={ __( 'Payment Gateways', 'newspack-plugin' ) }
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
								'Missing or invalid SSL configuration detected. To collect payments, the site must be secured with SSL. ',
								'newspack-plugin'
							) }
							<ExternalLink href="https://stripe.com/docs/security/guide">
								{ __( 'Learn more', 'newspack-plugin' ) }
							</ExternalLink>
						</>
					}
				/>
			) }
			<Stripe
				errors={ errors }
				is_ssl={ is_ssl }
				stripe={ stripe }
			/>
			{ 0 < Object.keys( 'paymentGateways' ).length && (
				<AdditionalSettings
					settings={ settings }
				/>
			) }
		</>
	);
};

export default PaymentGateways;
