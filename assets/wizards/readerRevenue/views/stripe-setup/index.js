/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl, ExternalLink, ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import isEmpty from 'lodash/isEmpty';

/**
 * Internal dependencies
 */
import {
	Button,
	Grid,
	Notice,
	Settings,
	SelectControl,
	TextControl,
	Wizard,
	ActionCard,
} from '../../../../components/src';
import NewsletterSettings from './newsletter-settings';
import { STRIPE, READER_REVENUE_WIZARD_SLUG } from '../../constants';
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
	const {
		stripe_data: data = {},
		platform_data,
		is_ssl,
		currency_fields = [],
		country_state_fields = [],
		errors = [],
	} = Wizard.useWizardData( 'reader-revenue' );

	const displayStripeSettingsOnly = platform_data?.platform === STRIPE;

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
			{ displayStripeSettingsOnly ? (
				<>
					{ ! isEmpty( data.connection_error ) && (
						<Notice isError noticeText={ data.connection_error } />
					) }
					<SettingsCard
						title={ __( 'Settings', 'newspack-plugin' ) }
						columns={ 1 }
						gutter={ 16 }
						noBorder
					>
						{ data.can_use_stripe_platform === false && (
							<Notice
								isError
								noticeText={ __(
									'The Stripe platform will not work properly on this site.',
									'newspack-plugin'
								) }
							/>
						) }
						<StripeKeysSettings />
						<Grid rowGap={ 16 }>
							<SelectControl
								label={ __( 'Country', 'newspack-plugin' ) }
								value={ data.location_code }
								options={ country_state_fields }
								onChange={ changeHandler( 'location_code' ) }
							/>
							<SelectControl
								label={ __( 'Currency', 'newspack-plugin' ) }
								value={ data.currency }
								options={ currency_fields }
								onChange={ changeHandler( 'currency' ) }
							/>
						</Grid>
					</SettingsCard>
					<SettingsCard
						title={ __( 'Newsletters', 'newspack-plugin' ) }
						description={ __(
							'Allow donors to sign up to your newsletter when donating.',
							'newspack-plugin'
						) }
						columns={ 1 }
						gutter={ 16 }
						noBorder
					>
						<NewsletterSettings
							listId={ data.newsletter_list_id }
							onChange={ changeHandler( 'newsletter_list_id' ) }
						/>
					</SettingsCard>
					<StripeFeeSettings data={ data } changeHandler={ changeHandler } />
				</>
			) : (
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
			) }
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
			{ displayStripeSettingsOnly && (
				<ActionCard
					title={ __( 'Webhooks', 'newspack-plugin' ) }
					titleLink="#/stripe-webhooks"
					href="#/stripe-webhooks"
					description={ __(
						'Manage the webhooks Stripe uses to communicate with your site.',
						'newspack-plugin'
					) }
					actionText={ __( 'Edit', 'newspack-plugin' ) }
				/>
			) }
		</>
	);
};

export default StripeSetup;
