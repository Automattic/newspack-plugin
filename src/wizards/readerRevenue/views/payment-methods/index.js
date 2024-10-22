/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { AdditionalSettings } from './additional-settings';
import { Stripe } from './stripe';
import { Notice, SectionHeader, Wizard } from '../../../../components/src';
import './style.scss';

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
