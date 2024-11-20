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
		</WizardsTab>
	);
} );
