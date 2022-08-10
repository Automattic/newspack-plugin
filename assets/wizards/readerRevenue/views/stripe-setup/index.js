/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { CheckboxControl, ExternalLink, ToggleControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { values } from 'lodash';

/**
 * Internal dependencies
 */
import {
	Button,
	Card,
	Grid,
	Notice,
	Settings,
	SelectControl,
	TextControl,
	Wizard,
} from '../../../../components/src';
import NewsletterSettings from './newsletter-settings';
import { STRIPE, READER_REVENUE_WIZARD_SLUG } from '../../constants';
import './style.scss';

const { SettingsCard } = Settings;

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
					{ __( 'Configure Stripe and enter your API keys', 'newspack' ) }
					{ ' – ' }
					<ExternalLink href="https://stripe.com/docs/keys#api-keys">
						{ __( 'learn how' ) }
					</ExternalLink>
				</p>
				<CheckboxControl
					label={ __( 'Use Stripe in test mode', 'newspack' ) }
					checked={ testMode }
					onChange={ changeHandler( 'testMode' ) }
					help={ __(
						'Test mode will not capture real payments. Use it for testing your purchase flow.',
						'newspack'
					) }
				/>
			</Grid>
			<Grid noMargin rowGap={ 16 }>
				{ testMode ? (
					<>
						<TextControl
							type="password"
							value={ testPublishableKey }
							label={ __( 'Test Publishable Key', 'newspack' ) }
							onChange={ changeHandler( 'testPublishableKey' ) }
						/>
						<TextControl
							type="password"
							value={ testSecretKey }
							label={ __( 'Test Secret Key', 'newspack' ) }
							onChange={ changeHandler( 'testSecretKey' ) }
						/>
					</>
				) : (
					<>
						<TextControl
							type="password"
							value={ publishableKey }
							label={ __( 'Publishable Key', 'newspack' ) }
							onChange={ changeHandler( 'publishableKey' ) }
						/>
						<TextControl
							type="password"
							value={ secretKey }
							label={ __( 'Secret Key', 'newspack' ) }
							onChange={ changeHandler( 'secretKey' ) }
						/>
					</>
				) }
			</Grid>
		</Grid>
	);
};

export const StripeCaptchaSettings = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	const {
		useCaptcha = false,
		captchaSiteKey = '',
		captchaSiteSecret = '',
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
					{ __(
						'Enabling reCaptcha for Stripe checkouts makes your site more secure.',
						'newspack'
					) }
					{ ' – ' }
					<ExternalLink href="https://www.google.com/recaptcha/admin/create">
						{ __( 'get started' ) }
					</ExternalLink>
				</p>
				<CheckboxControl
					label={ __( 'Use reCaptcha v3 to secure Stripe checkout', 'newspack' ) }
					checked={ useCaptcha }
					onChange={ changeHandler( 'useCaptcha' ) }
					help={ __(
						'Without reCaptcha, your Stripe checkout process may be vulnerable to bot attacks and card testing.',
						'newspack-blocks'
					) }
				/>
			</Grid>
			{ useCaptcha && ( ! captchaSiteKey || ! captchaSiteSecret ) && (
				<Notice
					noticeText={ __(
						'You must enter a valid site key and secret to use reCaptcha.',
						'newspack'
					) }
				/>
			) }
			<Grid noMargin rowGap={ 16 }>
				{ useCaptcha && (
					<>
						<TextControl
							value={ captchaSiteKey }
							label={ __( 'Site Key', 'newspack' ) }
							onChange={ changeHandler( 'captchaSiteKey' ) }
						/>
						<TextControl
							type="password"
							value={ captchaSiteSecret }
							label={ __( 'Site Secret', 'newspack' ) }
							onChange={ changeHandler( 'captchaSiteSecret' ) }
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
	} = Wizard.useWizardData( 'reader-revenue' );

	const hasWebhook =
		data.webhook_url &&
		Array.isArray( data.webhooks ) &&
		data.webhooks.filter( webhook => webhook.url === data.webhook_url ).length > 0;

	const [ isLoading, setIsLoading ] = useState( false );
	const createWebhooks = () => {
		setIsLoading( true );
		apiFetch( {
			path: '/newspack/v1/stripe/create-webhooks',
		} ).then( () => {
			window.location.reload();
		} );
	};

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
			{ is_ssl === false && (
				<Notice
					isWarning
					noticeText={
						<a href="https://stripe.com/docs/security/guide">
							{ __(
								'This site does not use SSL. The page hosting the Stipe integration should be secured with SSL.',
								'newspack'
							) }
						</a>
					}
				/>
			) }
			{ displayStripeSettingsOnly ? (
				<>
					{ data.connection_error !== false && (
						<Notice isError noticeText={ data.connection_error } />
					) }
					<SettingsCard title={ __( 'Settings', 'newspack' ) } columns={ 1 } gutter={ 16 } noBorder>
						{ data.can_use_stripe_platform === false && (
							<Notice
								isError
								noticeText={ __(
									'The Stripe platform will not work properly on this site.',
									'newspack'
								) }
							/>
						) }
						<StripeKeysSettings />
						<Grid rowGap={ 16 }>
							<SelectControl
								label={ __( 'Country', 'newspack' ) }
								value={ data.location_code }
								options={ country_state_fields }
								onChange={ changeHandler( 'location_code' ) }
							/>
							<SelectControl
								label={ __( 'Currency', 'newspack' ) }
								value={ data.currency }
								options={ currency_fields }
								onChange={ changeHandler( 'currency' ) }
							/>
						</Grid>
					</SettingsCard>
					<SettingsCard
						title={ __( 'reCaptcha v3 Settings', 'newspack' ) }
						columns={ 1 }
						gutter={ 16 }
						noBorder
					>
						{ data.can_use_stripe_platform === false && (
							<Notice
								isError
								noticeText={ __(
									'The Stripe platform will not work properly on this site.',
									'newspack'
								) }
							/>
						) }
						<StripeCaptchaSettings />
					</SettingsCard>
					<SettingsCard
						title={ __( 'Newsletters', 'newspack' ) }
						description={ __(
							'Allow donors to sign up to your newsletter when donating.',
							'newspack'
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
					<SettingsCard
						title={ __( 'Fee', 'newspack' ) }
						description={ __(
							'If you have a non-default or negotiated fee with Stripe, update its parameters here.',
							'newspack'
						) }
						columns={ 1 }
						noBorder
					>
						<Grid noMargin rowGap={ 16 }>
							<TextControl
								type="number"
								step="0.1"
								value={ data.fee_multiplier }
								label={ __( 'Fee multiplier', 'newspack' ) }
								onChange={ changeHandler( 'fee_multiplier' ) }
							/>
							<TextControl
								type="number"
								step="0.1"
								value={ data.fee_static }
								label={ __( 'Fee static portion', 'newspack' ) }
								onChange={ changeHandler( 'fee_static' ) }
							/>
						</Grid>
					</SettingsCard>
					<SettingsCard
						title={ __( 'Webhooks', 'newspack' ) }
						description={ __(
							'These need to be configured to allow Stripe to communicate with the site.',
							'newspack'
						) }
						columns={ 1 }
						gutter={ 16 }
						noBorder
					>
						<>
							{ data.webhooks?.errors ? (
								<Notice isError noticeText={ values( data.webhooks?.errors ).join( ', ' ) } />
							) : (
								<>
									{ data.webhooks.length ? (
										<ul>
											{ data.webhooks.map( ( webhook, i ) => (
												<li key={ i }>
													- <code>{ webhook.url }</code>
												</li>
											) ) }
										</ul>
									) : (
										<Notice isInfo noticeText={ __( 'No webhooks defined.', 'newspack' ) } />
									) }
									<Card noBorder buttonsCard>
										{ hasWebhook && (
											<p>{ __( 'Webhooks have already been created.', 'newspack' ) }</p>
										) }
										<Button
											isLink
											disabled={ isLoading || hasWebhook }
											onClick={ createWebhooks }
											isSecondary
										>
											{ __( 'Create Webhook', 'newspack' ) }
										</Button>
									</Card>
								</>
							) }
						</>
					</SettingsCard>
				</>
			) : (
				<>
					<Grid>
						<ToggleControl
							label={ __( 'Enable Stripe', 'newspack' ) }
							checked={ data.enabled }
							onChange={ changeHandler( 'enabled' ) }
						/>
					</Grid>
					{ data.enabled ? (
						<StripeKeysSettings />
					) : (
						<Grid>
							<p className="newspack-payment-setup-screen__info">
								{ __( 'Other gateways can be enabled and set up in the ', 'newspack' ) }
								<ExternalLink href="/wp-admin/admin.php?page=wc-settings&tab=checkout">
									{ __( 'WooCommerce payment gateway settings', 'newspack' ) }
								</ExternalLink>
							</p>
						</Grid>
					) }
				</>
			) }
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings', 'newspack' ) }
				</Button>
			</div>
		</>
	);
};

export default StripeSetup;
