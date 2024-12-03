/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Stripe } from './stripe';
import { WooPayments } from './woopayments';
import { Notice, Wizard } from '../../../../components/src';
import WizardsSection from '../../../wizards-section';

import './style.scss';

const PaymentGateways = () => {
	const {
		payment_gateways: paymentGateways = {},
		is_ssl,
		errors = [],
		plugin_status,
		platform_data = {},
	} = Wizard.useWizardData( 'newspack-audience/payment' );
	if ( false === plugin_status || 'wc' !== platform_data?.platform ) {
		return null;
	}

	const { stripe = false, woopayments = false } = paymentGateways;
	return (
		<WizardsSection
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
		>
			{ errors.length > 0 &&
				errors.map( ( error, index ) => (
					<Notice
						isError
						key={ index }
						noticeText={ <span>{ error.message }</span> }
					/>
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
			<Stripe stripe={ stripe } />
			<WooPayments woopayments={ woopayments } />
		</WizardsSection>
	);
};

export default PaymentGateways;
