/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useState } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
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
	Card,
	CheckboxControl,
	Grid,
	Button,
	TextControl,
	ToggleControl,
	SelectControl,
	Notice,
	Settings,
	Wizard,
} from '../../../../components/src';
import NewsletterSettings from './newsletter-settings';
import { STRIPE, READER_REVENUE_WIZARD_SLUG } from '../../constants';

const { SettingsCard } = Settings;

export const StripeKeysSettings = () => {
	const wizardData = Wizard.useWizardData();
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
		<Fragment>
			<Card noBorder>
				<p className="newspack-payment-setup-screen__api-keys-instruction">
					{ __( 'Configure Stripe and enter your API keys' ) }
					{ ' – ' }
					<ExternalLink href="https://stripe.com/docs/keys#api-keys">
						{ __( 'learn how' ) }
					</ExternalLink>
				</p>
				<CheckboxControl
					label={ __( 'Use Stripe in test mode' ) }
					checked={ testMode }
					onChange={ changeHandler( 'testMode' ) }
					tooltip="Test mode will not capture real payments. Use it for testing your purchase flow."
				/>
			</Card>
			<Grid noMargin>
				{ testMode ? (
					<Fragment>
						<TextControl
							type="password"
							value={ testPublishableKey }
							label={ __( 'Test Publishable Key' ) }
							onChange={ changeHandler( 'testPublishableKey' ) }
						/>
						<TextControl
							type="password"
							value={ testSecretKey }
							label={ __( 'Test Secret Key' ) }
							onChange={ changeHandler( 'testSecretKey' ) }
						/>
					</Fragment>
				) : (
					<Fragment>
						<TextControl
							type="password"
							value={ publishableKey }
							label={ __( 'Publishable Key' ) }
							onChange={ changeHandler( 'publishableKey' ) }
						/>
						<TextControl
							type="password"
							value={ secretKey }
							label={ __( 'Secret Key' ) }
							onChange={ changeHandler( 'secretKey' ) }
						/>
					</Fragment>
				) }
			</Grid>
		</Fragment>
	);
};

const StripeSetup = () => {
	const {
		stripe_data: data = {},
		platform_data,
		is_ssl,
		currency_fields = [],
	} = Wizard.useWizardData( {} );

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
		<Fragment>
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
					<SettingsCard title={ __( 'Settings', 'newspack' ) } columns={ 1 }>
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
						<SelectControl
							label={ __( 'Which currency does your business use?', 'newspack' ) }
							value={ data.currency }
							options={ currency_fields }
							onChange={ changeHandler( 'currency' ) }
						/>
					</SettingsCard>
					<SettingsCard
						title={ __( 'Newsletters', 'newspack' ) }
						description={ __(
							'Allow donors to sign up to your newsletter when donating.',
							'newspack'
						) }
						columns={ 1 }
					>
						<NewsletterSettings
							listId={ data.newsletter_list_id }
							onChange={ changeHandler( 'newsletter_list_id' ) }
						/>
					</SettingsCard>
					<SettingsCard
						title={ __( 'Webhooks', 'newspack' ) }
						description={ __(
							'These need to be configured to allow Stripe to communicate with the site.',
							'newspack'
						) }
						columns={ 1 }
					>
						<div>
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
										<div className="mb3">{ __( 'No webhooks defined.', 'newspack' ) }</div>
									) }
									<Button isLink disabled={ isLoading } onClick={ createWebhooks } isSecondary>
										{ __( 'Create webhooks', 'newspack' ) }
									</Button>
								</>
							) }
						</div>
					</SettingsCard>
				</>
			) : (
				<>
					<Grid>
						<ToggleControl
							label={ __( 'Enable Stripe' ) }
							checked={ data.enabled }
							onChange={ changeHandler( 'enabled' ) }
						/>
					</Grid>
					{ data.enabled ? (
						<StripeKeysSettings />
					) : (
						<Grid>
							<p className="newspack-payment-setup-screen__info">
								{ __( 'Other gateways can be enabled and set up in the ' ) }
								<ExternalLink href="/wp-admin/admin.php?page=wc-settings&tab=checkout">
									{ __( 'WooCommerce payment gateway settings' ) }
								</ExternalLink>
							</p>
						</Grid>
					) }
				</>
			) }
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings' ) }
				</Button>
			</div>
		</Fragment>
	);
};

export default StripeSetup;
