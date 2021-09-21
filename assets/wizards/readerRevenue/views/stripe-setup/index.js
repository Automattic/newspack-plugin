/**
 * Stripe Setup Screen
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { Icon, chevronDown } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	CheckboxControl,
	Grid,
	Button,
	TextControl,
	ToggleControl,
	SelectControl,
	Notice,
	withWizardScreen,
} from '../../../../components/src';

export const StripeKeysSettings = ( { data, onChange } ) => {
	const {
		testMode = false,
		publishableKey = '',
		secretKey = '',
		testPublishableKey = '',
		testSecretKey = '',
	} = data;
	return (
		<Grid columns={ 1 } gutter={ 16 }>
			<p>
				{ __( 'Configure Stripe and enter your API keys' ) }
				{ ' – ' }
				<ExternalLink href="https://stripe.com/docs/keys#api-keys">
					{ __( 'learn how' ) }
				</ExternalLink>
			</p>
			<CheckboxControl
				label={ __( 'Use Stripe in test mode' ) }
				checked={ testMode }
				onChange={ _testMode => onChange( { ...data, testMode: _testMode } ) }
				tooltip="Test mode will not capture real payments. Use it for testing your purchase flow."
			/>
			<Grid gutter={ 32 }>
				{ testMode ? (
					<>
						<TextControl
							type="password"
							value={ testPublishableKey }
							label={ __( 'Test Publishable Key' ) }
							onChange={ _testPublishableKey =>
								onChange( { ...data, testPublishableKey: _testPublishableKey } )
							}
						/>
						<TextControl
							type="password"
							value={ testSecretKey }
							label={ __( 'Test Secret Key' ) }
							onChange={ _testSecretKey => onChange( { ...data, testSecretKey: _testSecretKey } ) }
						/>
					</>
				) : (
					<>
						<TextControl
							type="password"
							value={ publishableKey }
							label={ __( 'Publishable Key' ) }
							onChange={ _publishableKey =>
								onChange( { ...data, publishableKey: _publishableKey } )
							}
						/>
						<TextControl
							type="password"
							value={ secretKey }
							label={ __( 'Secret Key' ) }
							onChange={ _secretKey => onChange( { ...data, secretKey: _secretKey } ) }
						/>
					</>
				) }
			</Grid>
		</Grid>
	);
};

const StripeSetup = ( { data, onChange, displayStripeSettingsOnly, currencyFields } ) => {
	const [ isLoading, setIsLoading ] = useState( false );
	const createWebhooks = () => {
		setIsLoading( true );
		apiFetch( {
			path: '/newspack/v1/stripe/create-webhooks',
		} ).then( () => {
			window.location.reload();
		} );
	};
	return (
		<>
			{ data.isSSL === false && (
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
					{ data.can_use_stripe_platform === false && (
						<Notice
							isError
							noticeText={ __(
								'The Stripe platform will not work properly on this site.',
								'newspack'
							) }
						/>
					) }
					<StripeKeysSettings data={ data } onChange={ onChange } />
					<Grid gutter={ 32 } style={ { marginTop: -16 } }>
						<SelectControl
							label={ __( 'Currency', 'newspack' ) }
							value={ data.currency }
							options={ currencyFields }
							onChange={ _currency => onChange( { ...data, currency: _currency } ) }
						/>
					</Grid>
					<details className="newspack-details" style={ { marginTop: 64 } }>
						<summary>
							<h2>{ __( 'Webhooks', 'newspack' ) }</h2>
							<Icon icon={ chevronDown } size={ 18 } />
						</summary>
						{ data.webhooks.length ? (
							<ul>
								{ data.webhooks.map( ( webhook, i ) => (
									<li key={ i }>
										<code>{ webhook.url }</code>
									</li>
								) ) }
							</ul>
						) : (
							<Notice isInfo noticeText={ __( 'No webhooks defined.', 'newspack' ) } />
						) }
						<Button disabled={ isLoading } onClick={ createWebhooks } isSecondary isSmall>
							{ __( 'Create webhooks', 'newspack' ) }
						</Button>
					</details>
				</>
			) : (
				<>
					<ToggleControl
						label={ __( 'Enable Stripe' ) }
						checked={ data.enabled }
						onChange={ _enabled => onChange( { ...data, enabled: _enabled } ) }
					/>
					{ data.enabled ? (
						<StripeKeysSettings data={ data } onChange={ onChange } />
					) : (
						<p>
							{ __( 'Other gateways can be enabled and set up in the ' ) }
							<ExternalLink href="/wp-admin/admin.php?page=wc-settings&tab=checkout">
								{ __( 'WooCommerce payment gateway settings' ) }
							</ExternalLink>
						</p>
					) }
				</>
			) }
		</>
	);
};

StripeSetup.defaultProps = {
	data: {},
	onChange: () => null,
};

export default withWizardScreen( StripeSetup );
