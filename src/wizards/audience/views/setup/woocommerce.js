/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizardScreen } from '../../../../components/src';
import WizardsTab from '../../../wizards-tab';
import Platform from '../../components/platform';
import StripeSetup from '../../components/stripe-setup';
import NRHSettings from '../../components/nrh-settings';

export default withWizardScreen( function () {
	return (
		<WizardsTab
			title={ __( 'Checkout & Payment', 'newspack-plugin' ) }
			description={ __(
				'WooCommerce configuration for donors and subscribers.',
				'newspack-plugin'
			) }
		>
			<Platform />
			<StripeSetup />
			<NRHSettings />
			{ /* TODO: Add Saleforce Settings from `/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/salesforce`*/ }
		</WizardsTab>
	);
} );
