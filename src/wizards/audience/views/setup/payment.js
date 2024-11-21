/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizardScreen, Wizard } from '../../../../components/src';
import WizardsTab from '../../../wizards-tab';
import Platform from '../../components/platform';
import PaymentGateways from '../../components/payment-methods';
import NRHSettings from '../../components/nrh-settings';
import BillingFields from '../../components/billing-fields';

export default withWizardScreen( function () {
	const data = Wizard.useWizardData( 'reader-revenue' );
	return (
		<WizardsTab
			title={ __( 'Checkout & Payment', 'newspack-plugin' ) }
			description={ __( 'Reader revenue configuration for donations and subscriptions.', 'newspack-plugin' ) }
		>
			<Platform />
			{ data?.platform_data?.platform === 'wc' && <PaymentGateways /> }
			{ data?.platform_data?.platform === 'wc' && <BillingFields /> }
			{ data?.platform_data?.platform === 'nrh' && <NRHSettings /> }
		</WizardsTab>
	);
} );
