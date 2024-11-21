/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizardScreen } from '../../../../components/src';
import WizardsTab from '../../../wizards-tab';

export default withWizardScreen( function () {
	return (
		<WizardsTab
			title={ __( 'Checkout & Payment', 'newspack-plugin' ) }
			description={ __( 'WooCommerce configuration for donors and subscribers.', 'newspack-plugin' ) }
		>
			<p>In progress.</p>
			{/* TODO: Add Platform from `/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/`*/}
			{/* TODO: Add Modal Checkout Billing Fields Settings from `/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/donations`*/}
			{/* TODO: Add Stripe Setup from `/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/stripe-setup`*/}
			{/* TODO: Add Saleforce Settings from `/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/salesforce`*/}
		</WizardsTab>
	);
} );
