/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl, ExternalLink, ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	Button,
	Grid,
	Notice,
	PluginInstaller,
	Settings,
	TextControl,
	Wizard,
} from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';
import './style.scss';

const { SettingsCard } = Settings;

const StripeFeeSettings = ( { data, changeHandler } ) => (
	<SettingsCard
		title={ __( 'Transaction Fees', 'newspack-plugin' ) }
		description={ __(
			'If you have a non-default or negotiated fee with Stripe, update its parameters here.',
			'newspack-plugin'
		) }
		columns={ 1 }
		noBorder
	>
		<Grid noMargin rowGap={ 16 }>
			<TextControl
				type="number"
				step="0.1"
				value={ data.fee_multiplier }
				label={ __( 'Fee multiplier', 'newspack-plugin' ) }
				onChange={ changeHandler( 'fee_multiplier' ) }
			/>
			<TextControl
				type="number"
				step="0.1"
				value={ data.fee_static }
				label={ __( 'Fee static portion', 'newspack-plugin' ) }
				onChange={ changeHandler( 'fee_static' ) }
			/>
		</Grid>
	</SettingsCard>
);

export const StripeKeysSettings = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	const {
		testMode = false,
		publishableKey = '',
		secretKey = '',
		testPublishableKey = '',
		testSecretKey = '',
	} = wizardData.stripe_data || {};

	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = key => value =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'stripe_data', key ],
			value,
		} );

	return (
		<Grid columns={ 1 } gutter={ 16 }>
			<Grid columns={ 1 } gutter={ 16 }>
				<p className="newspack-payment-setup-screen__api-keys-instruction">
					{ __( 'Configure Stripe and enter your API keys', 'newspack-plugin' ) }
					{ ' – ' }
					<ExternalLink href="https://stripe.com/docs/keys#api-keys">
						{ __( 'learn how' ) }
					</ExternalLink>
				</p>
				<CheckboxControl
					label={ __( 'Use Stripe in test mode', 'newspack-plugin' ) }
					checked={ testMode }
					onChange={ changeHandler( 'testMode' ) }
					help={ __(
						'Test mode will not capture real payments. Use it for testing your purchase flow.',
						'newspack-plugin'
					) }
				/>
			</Grid>
			<Grid noMargin rowGap={ 16 }>
				{ testMode ? (
					<>
						<TextControl
							type="password"
							value={ testPublishableKey }
							label={ __( 'Test Publishable Key', 'newspack-plugin' ) }
							onChange={ changeHandler( 'testPublishableKey' ) }
						/>
						<TextControl
							type="password"
							value={ testSecretKey }
							label={ __( 'Test Secret Key', 'newspack-plugin' ) }
							onChange={ changeHandler( 'testSecretKey' ) }
						/>
					</>
				) : (
					<>
						<TextControl
							type="password"
							value={ publishableKey }
							label={ __( 'Publishable Key', 'newspack-plugin' ) }
							onChange={ changeHandler( 'publishableKey' ) }
						/>
						<TextControl
							type="password"
							value={ secretKey }
							label={ __( 'Secret Key', 'newspack-plugin' ) }
							onChange={ changeHandler( 'secretKey' ) }
						/>
					</>
				) }
			</Grid>
		</Grid>
	);
};

const StripeSetup = () => {
	const { stripe_data: data = {}, is_ssl, errors = [] } = Wizard.useWizardData( 'reader-revenue' );

	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = key => value =>
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

	if ( ! data ) {
		return (
			<>
				<p>
					{ __(
						'To configure Stripe, install the WooCommerce Stripe Gateway plugin.',
						'newspack-plugin'
					) }
				</p>
				<PluginInstaller
					plugins={ [ 'woocommerce-gateway-stripe' ] }
					onStatus={ ( { complete } ) => {
						if ( complete ) {
							console.log( complete );
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
			</>
		);
	}

	return (
		<>
			{ errors.length > 0 &&
				errors.map( ( error, index ) => (
					<Notice isError key={ index } noticeText={ <span>{ error.message }</span> } />
				) ) }
			{ is_ssl === false && (
				<Notice
					isWarning
					noticeText={
						<a href="https://stripe.com/docs/security/guide">
							{ __(
								'This site does not use SSL. The page hosting the Stipe integration should be secured with SSL.',
								'newspack-plugin'
							) }
						</a>
					}
				/>
			) }
			<>
				<Grid>
					<ToggleControl
						label={ __( 'Enable Stripe', 'newspack-plugin' ) }
						checked={ data.enabled }
						onChange={ changeHandler( 'enabled' ) }
					/>
				</Grid>
				{ data.enabled ? (
					<>
						<StripeKeysSettings />
						<StripeFeeSettings data={ data } changeHandler={ changeHandler } />
						<Grid columns={ 2 }>
							<CheckboxControl
								label={ __( 'Allow donors to cover transaction fees', 'newspack-plugin' ) }
								checked={ data.allow_covering_fees }
								onChange={ changeHandler( 'allow_covering_fees' ) }
								help={ __(
									"If checked, the donors will be able to cover Stripe's transaction fees.",
									'newspack-plugin'
								) }
							/>
							<CheckboxControl
								label={ __( 'Enable covering fees by default', 'newspack-plugin' ) }
								checked={ data.allow_covering_fees_default }
								onChange={ changeHandler( 'allow_covering_fees_default' ) }
								help={ __(
									'If checked, the option to cover transaction fees will be checked by default.',
									'newspack-plugin'
								) }
							/>
						</Grid>
						<TextControl
							value={ data.allow_covering_fees_label }
							label={ __( 'Custom message', 'newspack-plugin' ) }
							placeholder={ __(
								'A message to explain the transaction fee option (optional).',
								'newspack-plugin'
							) }
							onChange={ changeHandler( 'allow_covering_fees_label' ) }
						/>
					</>
				) : (
					<Grid>
						<p className="newspack-payment-setup-screen__info">
							{ __( 'Other gateways can be enabled and set up in the ', 'newspack-plugin' ) }
							<ExternalLink href="/wp-admin/admin.php?page=wc-settings&tab=checkout">
								{ __( 'WooCommerce payment gateway settings', 'newspack-plugin' ) }
							</ExternalLink>
						</p>
					</Grid>
				) }
			</>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</>
	);
};

export default StripeSetup;
